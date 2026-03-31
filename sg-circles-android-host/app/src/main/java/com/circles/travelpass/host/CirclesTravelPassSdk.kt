package com.circles.travelpass.host

import android.app.Activity
import android.content.Context
import android.content.Intent
import androidx.activity.result.ActivityResultLauncher
import java.lang.ref.WeakReference

data class TravelPassLaunchRequest(
  val correlationId: String,
  val currentPlanName: String,
  val currentUsageGb: String,
  val destinationName: String,
  val lineNumber: String,
  val recommendedPassId: String,
  val renewalDate: String,
  val sessionId: String,
  val sourcePlatform: String,
  val sourceScreen: String,
  val subscriberId: String,
)

data class TravelPassCompletion(
  val capturedAt: String,
  val correlationId: String,
  val coverageSummary: String,
  val destinationName: String,
  val includedData: String,
  val price: String,
  val selectedPassId: String,
  val selectedPassName: String,
)

interface CirclesTravelPassDelegate {
  fun onFlowReady() = Unit

  fun onFlowCompleted(result: TravelPassCompletion) = Unit

  fun onFlowClosed() = Unit
}

object CirclesTravelPassSdk {
  private var delegateRef: WeakReference<CirclesTravelPassDelegate>? = null

  fun launch(
    activity: Activity,
    request: TravelPassLaunchRequest,
    delegate: CirclesTravelPassDelegate? = null,
  ) {
    delegateRef = delegate?.let(::WeakReference)
    activity.startActivity(createIntent(activity, request))
  }

  fun launch(
    context: Context,
    request: TravelPassLaunchRequest,
    delegate: CirclesTravelPassDelegate? = null,
  ) {
    delegateRef = delegate?.let(::WeakReference)
    val intent = createIntent(context, request)
    if (context !is Activity) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
  }

  fun launch(
    launcher: ActivityResultLauncher<Intent>,
    context: Context,
    request: TravelPassLaunchRequest,
    delegate: CirclesTravelPassDelegate? = null,
  ) {
    delegateRef = delegate?.let(::WeakReference)
    launcher.launch(createIntent(context, request))
  }

  internal fun readLaunchRequest(intent: Intent): TravelPassLaunchRequest? {
    val correlationId = intent.getStringExtra(EXTRA_CORRELATION_ID) ?: return null
    val currentPlanName = intent.getStringExtra(EXTRA_CURRENT_PLAN_NAME) ?: return null
    val currentUsageGb = intent.getStringExtra(EXTRA_CURRENT_USAGE_GB) ?: return null
    val destinationName = intent.getStringExtra(EXTRA_DESTINATION_NAME) ?: return null
    val lineNumber = intent.getStringExtra(EXTRA_LINE_NUMBER) ?: return null
    val recommendedPassId = intent.getStringExtra(EXTRA_RECOMMENDED_PASS_ID) ?: return null
    val renewalDate = intent.getStringExtra(EXTRA_RENEWAL_DATE) ?: return null
    val sessionId = intent.getStringExtra(EXTRA_SESSION_ID) ?: return null
    val sourcePlatform = intent.getStringExtra(EXTRA_SOURCE_PLATFORM) ?: return null
    val sourceScreen = intent.getStringExtra(EXTRA_SOURCE_SCREEN) ?: return null
    val subscriberId = intent.getStringExtra(EXTRA_SUBSCRIBER_ID) ?: return null

    return TravelPassLaunchRequest(
      correlationId = correlationId,
      currentPlanName = currentPlanName,
      currentUsageGb = currentUsageGb,
      destinationName = destinationName,
      lineNumber = lineNumber,
      recommendedPassId = recommendedPassId,
      renewalDate = renewalDate,
      sessionId = sessionId,
      sourcePlatform = sourcePlatform,
      sourceScreen = sourceScreen,
      subscriberId = subscriberId,
    )
  }

  internal fun notifyReady() {
    delegateRef?.get()?.onFlowReady()
  }

  internal fun notifyCompleted(result: TravelPassCompletion) {
    delegateRef?.get()?.onFlowCompleted(result)
    delegateRef = null
  }

  internal fun notifyClosed() {
    delegateRef?.get()?.onFlowClosed()
    delegateRef = null
  }

  internal fun toBrownfieldPayload(request: TravelPassLaunchRequest): Map<String, Any> {
    return mapOf(
      "correlationId" to request.correlationId,
      "currentPlanName" to request.currentPlanName,
      "currentUsageGb" to request.currentUsageGb,
      "destinationName" to request.destinationName,
      "lineNumber" to request.lineNumber,
      "recommendedPassId" to request.recommendedPassId,
      "renewalDate" to request.renewalDate,
      "sessionId" to request.sessionId,
      "sourcePlatform" to request.sourcePlatform,
      "sourceScreen" to request.sourceScreen,
      "subscriberId" to request.subscriberId,
    )
  }

  internal fun toCompletion(messageData: Any?): TravelPassCompletion? {
    val data = messageData as? Map<*, *> ?: return null

    fun readString(key: String): String {
      return data[key] as? String ?: ""
    }

    return TravelPassCompletion(
      capturedAt = readString("capturedAt"),
      correlationId = readString("correlationId"),
      coverageSummary = readString("coverageSummary"),
      destinationName = readString("destinationName"),
      includedData = readString("includedData"),
      price = readString("price"),
      selectedPassId = readString("selectedPassId"),
      selectedPassName = readString("selectedPassName"),
    )
  }

  fun createIntent(context: Context, request: TravelPassLaunchRequest): Intent {
    return Intent(context, CirclesRoamingContainerActivity::class.java).apply {
      putExtra(EXTRA_CORRELATION_ID, request.correlationId)
      putExtra(EXTRA_CURRENT_PLAN_NAME, request.currentPlanName)
      putExtra(EXTRA_CURRENT_USAGE_GB, request.currentUsageGb)
      putExtra(EXTRA_DESTINATION_NAME, request.destinationName)
      putExtra(EXTRA_LINE_NUMBER, request.lineNumber)
      putExtra(EXTRA_RECOMMENDED_PASS_ID, request.recommendedPassId)
      putExtra(EXTRA_RENEWAL_DATE, request.renewalDate)
      putExtra(EXTRA_SESSION_ID, request.sessionId)
      putExtra(EXTRA_SOURCE_PLATFORM, request.sourcePlatform)
      putExtra(EXTRA_SOURCE_SCREEN, request.sourceScreen)
      putExtra(EXTRA_SUBSCRIBER_ID, request.subscriberId)
    }
  }

  private const val EXTRA_CORRELATION_ID = "circles.travelpass.extra.CORRELATION_ID"
  private const val EXTRA_CURRENT_PLAN_NAME = "circles.travelpass.extra.CURRENT_PLAN_NAME"
  private const val EXTRA_CURRENT_USAGE_GB = "circles.travelpass.extra.CURRENT_USAGE_GB"
  private const val EXTRA_DESTINATION_NAME = "circles.travelpass.extra.DESTINATION_NAME"
  private const val EXTRA_LINE_NUMBER = "circles.travelpass.extra.LINE_NUMBER"
  private const val EXTRA_RECOMMENDED_PASS_ID = "circles.travelpass.extra.RECOMMENDED_PASS_ID"
  private const val EXTRA_RENEWAL_DATE = "circles.travelpass.extra.RENEWAL_DATE"
  private const val EXTRA_SESSION_ID = "circles.travelpass.extra.SESSION_ID"
  private const val EXTRA_SOURCE_PLATFORM = "circles.travelpass.extra.SOURCE_PLATFORM"
  private const val EXTRA_SOURCE_SCREEN = "circles.travelpass.extra.SOURCE_SCREEN"
  private const val EXTRA_SUBSCRIBER_ID = "circles.travelpass.extra.SUBSCRIBER_ID"
}
