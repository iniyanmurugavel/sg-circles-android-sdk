package com.circles.travelpass.host

import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.core.view.isGone
import androidx.core.view.setPadding
import com.circles.travelpass.brownfield.BrownfieldActivity
import com.circles.travelpass.brownfield.ReactNativeFragment
import com.circles.travelpass.brownfield.ReactNativeHostManager
import com.circles.travelpass.brownfield.setUpNativeBackHandling
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import expo.modules.brownfield.BrownfieldMessaging
import expo.modules.brownfield.BrownfieldState

class CirclesRoamingContainerActivity : BrownfieldActivity(), DefaultHardwareBackBtnHandler {
  private var didComplete = false
  private var listenerId: String? = null
  private lateinit var loadingOverlay: View
  private val loadingTimeoutRunnable = Runnable { hideLoadingOverlay() }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    window.decorView.setBackgroundColor(BACKGROUND_COLOR)

    val launchRequest =
      CirclesTravelPassSdk.readLaunchRequest(intent)
        ?: run {
          Toast.makeText(this, "Missing Circles Roaming launch request", Toast.LENGTH_SHORT)
            .show()
          finish()
          return
        }
    val launchPayload = CirclesTravelPassSdk.toBrownfieldPayload(launchRequest)
    BrownfieldState.set(CIRCLES_ROAM_LAUNCH_STATE_KEY, launchPayload)

    // Listen for brownfield SDK messages (like 'ready' & 'completed')
    // IMPORTANT: Messages from React Native are received on a background thread (`mqt_v_js`).
    // Any UI manipulation or Activity routing must be explicitly dispatched to the main UI thread.
    listenerId =
      BrownfieldMessaging.addListener { message ->
        runOnUiThread { handleBrownfieldMessage(message) }
      }

    showRoamingFlow()
    BrownfieldMessaging.sendMessage(
      mapOf(
        "type" to CIRCLES_ROAM_LAUNCH_MESSAGE,
        "data" to launchPayload,
      )
    )
  }

  override fun onDestroy() {
    window.decorView.removeCallbacks(loadingTimeoutRunnable)
    listenerId?.let(BrownfieldMessaging::removeListener)
    listenerId = null
    if (isFinishing && !didComplete) {
      CirclesTravelPassSdk.notifyClosed()
    }
    super.onDestroy()
  }

  override fun invokeDefaultOnBackPressed() {
    onBackPressedDispatcher.onBackPressed()
  }

  private fun handleBrownfieldMessage(message: Map<String, Any?>) {
    when (message["type"] as? String) {
      CIRCLES_ROAM_READY_MESSAGE -> {
        hideLoadingOverlay()
        CirclesTravelPassSdk.notifyReady()
        Toast.makeText(this, "Shared roaming flow ready", Toast.LENGTH_SHORT).show()
      }
      CIRCLES_ROAM_COMPLETED_MESSAGE -> {
        val completion =
          CirclesTravelPassSdk.toCompletion(message["data"])
            ?: return
        didComplete = true
        CirclesTravelPassSdk.notifyCompleted(completion)
        Toast.makeText(this, "${completion.selectedPassName} activated", Toast.LENGTH_SHORT).show()
        finish()
      }
    }
  }

  private fun showRoamingFlow() {
    ReactNativeHostManager.shared.initialize(application)

    val shell =
      LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        layoutParams =
          ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
          )
        setBackgroundColor(BACKGROUND_COLOR)
      }

    val toolbar =
      androidx.appcompat.widget.Toolbar(this).apply {
        title = "Circles Roaming"
        setTitleTextColor(Color.WHITE)
        setBackgroundColor(Color.parseColor("#151515"))
        setNavigationIcon(androidx.appcompat.R.drawable.abc_ic_ab_back_material)
        setNavigationOnClickListener { finish() }
      }

    shell.addView(
      toolbar,
      LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT
      )
    )

    val contentContainer = FrameLayout(this).apply {
      layoutParams = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        0,
        1f // Take remaining space
      )
    }
    
    val reactContainer = ReactNativeFragment.createFragmentHost(this)
    contentContainer.addView(
      reactContainer,
      FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      ),
    )

    loadingOverlay = buildLoadingOverlay()
    contentContainer.addView(
      loadingOverlay,
      FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      ),
    )

    shell.addView(contentContainer)
    setContentView(shell)

    // Handle Edge-to-Edge properly
    androidx.core.view.ViewCompat.setOnApplyWindowInsetsListener(shell) { v, insets ->
      val bars = insets.getInsets(androidx.core.view.WindowInsetsCompat.Type.systemBars())
      v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      insets
    }

    setUpNativeBackHandling()
    window.decorView.postDelayed(loadingTimeoutRunnable, LOADING_OVERLAY_TIMEOUT_MS)
  }

  private fun buildLoadingOverlay(): View {
    val density = resources.displayMetrics.density
    val padding = (24 * density).toInt()

    val statusText =
      TextView(this).apply {
        text = "Preparing Circles Roaming"
        textSize = 18f
        setTextColor(Color.WHITE)
      }

    val detailText =
      TextView(this).apply {
        text = "Loading the shared Expo module from the SDK."
        textSize = 14f
        setTextColor(SECONDARY_TEXT_COLOR)
      }

    val stack =
      LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER_HORIZONTAL
        setPadding(padding)
        addView(ProgressBar(context).apply { isIndeterminate = true })
        addView(statusText)
        addView(detailText)
      }

    return FrameLayout(this).apply {
      setBackgroundColor(BACKGROUND_COLOR)
      addView(
        stack,
        FrameLayout.LayoutParams(
          ViewGroup.LayoutParams.WRAP_CONTENT,
          ViewGroup.LayoutParams.WRAP_CONTENT,
          Gravity.CENTER,
        ),
      )
    }
  }

  private fun hideLoadingOverlay() {
    if (!::loadingOverlay.isInitialized || loadingOverlay.isGone) {
      return
    }

    loadingOverlay.animate().alpha(0f).setDuration(180).withEndAction {
      loadingOverlay.isGone = true
      (loadingOverlay.parent as? ViewGroup)?.removeView(loadingOverlay)
    }.start()
  }

  companion object {
    private const val BACKGROUND_COLOR = -16314851
    private const val CIRCLES_ROAM_COMPLETED_MESSAGE = "circles.roaming.completed"
    private const val CIRCLES_ROAM_LAUNCH_MESSAGE = "circles.roaming.launch"
    private const val CIRCLES_ROAM_LAUNCH_STATE_KEY = "circles.roaming.launchContext"
    private const val CIRCLES_ROAM_READY_MESSAGE = "circles.roaming.ready"
    private const val LOADING_OVERLAY_TIMEOUT_MS = 3500L
    private const val SECONDARY_TEXT_COLOR = -5924215
  }
}
