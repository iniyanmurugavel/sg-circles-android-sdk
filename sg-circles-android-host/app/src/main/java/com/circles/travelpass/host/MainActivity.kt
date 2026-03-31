package com.circles.travelpass.host

import android.graphics.Color
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity(), CirclesTravelPassDelegate {
  private val launchRequest =
    TravelPassLaunchRequest(
      correlationId = "host-android-circles-roaming-001",
      currentPlanName = "Circles 5G Plus",
      currentUsageGb = "92 GB",
      destinationName = "Tokyo",
      lineNumber = "+65 8111 2468",
      recommendedPassId = "roam-like-local",
      renewalDate = "02 Apr 2026",
      sessionId = "host-session-circles-roaming-001",
      sourcePlatform = "android",
      sourceScreen = "host-app-dashboard",
      subscriberId = "subscriber-circles-001",
    )

  private var bannerTitle by mutableStateOf("Host app ready")
  private var bannerMessage by mutableStateOf(
    "Tap the shared flow button to launch the Circles Roaming module through expo-brownfield with a typed request."
  )
  private var lastCompletion by mutableStateOf<TravelPassCompletion?>(null)

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge(
      statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
      navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
    )
    super.onCreate(savedInstanceState)

    setContent {
      CirclesHostTheme {
        MainHostScreen(
          request = launchRequest,
          bannerTitle = bannerTitle,
          bannerMessage = bannerMessage,
          lastCompletion = lastCompletion,
          onLaunchClick = ::launchSharedFlow,
        )
      }
    }
  }

  override fun onFlowReady() {
    bannerTitle = "Shared flow connected"
    bannerMessage = "The brownfield SDK is ready and the native launch context has been accepted."
  }

  override fun onFlowCompleted(result: TravelPassCompletion) {
    lastCompletion = result
    bannerTitle = "Activation handoff complete"
    bannerMessage =
      "${result.selectedPassName} is ready for ${result.destinationName}. The host app received the typed completion payload."
    Toast.makeText(this, "Welcome back to Native Android!", Toast.LENGTH_SHORT).show()
  }

  override fun onFlowClosed() {
    if (lastCompletion == null) {
      bannerTitle = "Flow closed"
      bannerMessage = "The user returned to the host app before completing the activation flow."
      Toast.makeText(this, "Returned to Native Android (Flow Closed)", Toast.LENGTH_SHORT).show()
    }
  }

  private fun launchSharedFlow() {
    lastCompletion = null
    bannerTitle = "Launching shared flow"
    bannerMessage = "Opening the Circles Roaming module from the host app."
    CirclesTravelPassSdk.launch(
      activity = this,
      request = launchRequest,
      delegate = this,
    )
  }
}

@Composable
private fun MainHostScreen(
  request: TravelPassLaunchRequest,
  bannerTitle: String,
  bannerMessage: String,
  lastCompletion: TravelPassCompletion?,
  onLaunchClick: () -> Unit,
) {
  Scaffold(
    containerColor = ComposeColor.Transparent,
    contentWindowInsets = WindowInsets(0, 0, 0, 0),
    topBar = { HostTopBar() },
  ) { innerPadding ->
    Box(
      modifier =
        Modifier
          .fillMaxSize()
          .background(
            brush =
              Brush.verticalGradient(
                listOf(
                  ComposeColor(0xFF04101C),
                  ComposeColor(0xFF071A2A),
                  ComposeColor(0xFF0B2234),
                )
              )
          )
    ) {
      DecorativeBackdrop()

      Column(
        modifier =
          Modifier
            .fillMaxSize()
            .padding(innerPadding)
            .verticalScroll(rememberScrollState())
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
      ) {
        PillLabel("Android host app")
        Text(
          text = "Compose host entry point for the expo-brownfield integration. The button below opens the shared Expo roaming flow with typed launch data.",
          style = MaterialTheme.typography.bodyLarge,
          color = ComposeColor(0xFFB6C7D8),
        )

        StatusCard(
          title = bannerTitle,
          message = bannerMessage,
        )

        DetailCard(
          title = "Launch payload",
          subtitle = "This native request is injected into the SDK before the React Native flow is shown.",
        ) {
          DetailRow("Destination", request.destinationName)
          DetailRow("Line", request.lineNumber)
          DetailRow("Plan", request.currentPlanName)
          DetailRow("Usage", request.currentUsageGb)
          DetailRow("Renewal", request.renewalDate)
          DetailRow("Recommended pass", request.recommendedPassId)
        }

        DetailCard(
          title = "Integration flow",
          subtitle = "The host keeps navigation ownership while the shared feature lives inside the SDK.",
        ) {
          JourneyStep(
            step = "1",
            title = "Host prepares request",
            body = "Build a typed launch request from subscriber, line, plan, and destination context.",
          )
          JourneyStep(
            step = "2",
            title = "SDK opens brownfield flow",
            body = "The singleton SDK launcher starts the transport activity and sends the request into Expo.",
          )
          JourneyStep(
            step = "3",
            title = "Host receives completion",
            body = "The delegate receives a typed completion model once the user finishes the travel pass flow.",
          )
        }

        if (lastCompletion != null) {
          DetailCard(
            title = "Latest completion",
            subtitle = "This data came back from the shared React Native flow through the SDK delegate.",
          ) {
            DetailRow("Selected pass", lastCompletion.selectedPassName)
            DetailRow("Destination", lastCompletion.destinationName)
            DetailRow("Data", lastCompletion.includedData)
            DetailRow("Coverage", lastCompletion.coverageSummary)
            DetailRow("Price", lastCompletion.price)
            DetailRow("Captured", lastCompletion.capturedAt)
          }
        }

        Button(
          onClick = onLaunchClick,
          modifier = Modifier.fillMaxWidth(),
          shape = RoundedCornerShape(20.dp),
          colors =
            ButtonDefaults.buttonColors(
              containerColor = ComposeColor(0xFF38E0C1),
              contentColor = ComposeColor(0xFF04101C),
            ),
        ) {
          Text(
            text = "Open Shared Travel Pass Flow",
            modifier = Modifier.padding(vertical = 6.dp),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
          )
        }
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HostTopBar() {
  CenterAlignedTopAppBar(
    colors =
      TopAppBarDefaults.topAppBarColors(
        containerColor = ComposeColor(0xFA04101C), // Matches theme gradient visually as a sticky bar
        titleContentColor = ComposeColor.White,
      ),
    navigationIcon = {
      IconButton(onClick = {}) {
        Icon(
          imageVector = Icons.Filled.Home,
          contentDescription = "App Icon",
          tint = ComposeColor.White
        )
      }
    },
    title = {
      Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
          text = "Circles Roaming",
          style = MaterialTheme.typography.titleLarge,
          fontWeight = FontWeight.Bold,
          color = ComposeColor.White,
        )
        Text(
          text = "Expo brownfield host shell",
          style = MaterialTheme.typography.labelMedium,
          color = ComposeColor(0xFF8DADC6),
        )
      }
    },
  )
}

@Composable
private fun StatusCard(title: String, message: String) {
  Card(
    colors = CardDefaults.cardColors(containerColor = ComposeColor(0xCC10273A)),
    shape = RoundedCornerShape(28.dp),
  ) {
    Column(
      modifier = Modifier.padding(20.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      Text(
        text = title,
        style = MaterialTheme.typography.titleLarge,
        fontWeight = FontWeight.SemiBold,
        color = ComposeColor.White,
      )
      Text(
        text = message,
        style = MaterialTheme.typography.bodyMedium,
        color = ComposeColor(0xFFB6C7D8),
      )
    }
  }
}

@Composable
private fun DetailCard(
  title: String,
  subtitle: String,
  content: @Composable ColumnScope.() -> Unit,
) {
  Card(
    colors = CardDefaults.cardColors(containerColor = ComposeColor(0xD8132E45)),
    shape = RoundedCornerShape(28.dp),
  ) {
    Column(
      modifier = Modifier.padding(20.dp),
      verticalArrangement = Arrangement.spacedBy(14.dp),
      content = {
        Text(
          text = title,
          style = MaterialTheme.typography.titleLarge,
          fontWeight = FontWeight.SemiBold,
          color = ComposeColor.White,
        )
        Text(
          text = subtitle,
          style = MaterialTheme.typography.bodyMedium,
          color = ComposeColor(0xFF9DB2C7),
        )
        content()
      },
    )
  }
}

@Composable
private fun DetailRow(label: String, value: String) {
  Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.SpaceBetween,
    verticalAlignment = Alignment.CenterVertically,
  ) {
    Text(
      text = label,
      style = MaterialTheme.typography.bodyMedium,
      color = ComposeColor(0xFF7F9AB2),
    )
    Spacer(modifier = Modifier.width(12.dp))
    Text(
      text = value,
      style = MaterialTheme.typography.bodyMedium,
      fontWeight = FontWeight.SemiBold,
      color = ComposeColor.White,
    )
  }
}

@Composable
private fun JourneyStep(step: String, title: String, body: String) {
  Row(
    modifier = Modifier.fillMaxWidth(),
    verticalAlignment = Alignment.Top,
  ) {
    Box(
      modifier =
        Modifier
          .size(34.dp)
          .clip(CircleShape)
          .background(ComposeColor(0xFF1E4965)),
      contentAlignment = Alignment.Center,
    ) {
      Text(
        text = step,
        style = MaterialTheme.typography.labelLarge,
        fontWeight = FontWeight.Bold,
        color = ComposeColor.White,
      )
    }
    Spacer(modifier = Modifier.width(12.dp))
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
      Text(
        text = title,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold,
        color = ComposeColor.White,
      )
      Text(
        text = body,
        style = MaterialTheme.typography.bodyMedium,
        color = ComposeColor(0xFFB6C7D8),
      )
    }
  }
}

@Composable
private fun PillLabel(text: String) {
  Surface(
    color = ComposeColor(0x332FE1C2),
    shape = RoundedCornerShape(999.dp),
  ) {
    Text(
      text = text,
      modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
      style = MaterialTheme.typography.labelLarge,
      color = ComposeColor(0xFF7FECD8),
    )
  }
}

@Composable
private fun DecorativeBackdrop() {
  Box(
    modifier =
      Modifier
        .fillMaxSize()
        .padding(top = 24.dp),
  ) {
    Box(
      modifier =
        Modifier
          .align(Alignment.TopStart)
          .size(220.dp)
          .clip(CircleShape)
          .background(ComposeColor(0x1F49E0B8)),
    )
    Box(
      modifier =
        Modifier
          .align(Alignment.TopEnd)
          .size(180.dp)
          .clip(CircleShape)
          .background(ComposeColor(0x1F4D73FF)),
    )
    Box(
      modifier =
        Modifier
          .align(Alignment.BottomEnd)
          .size(240.dp)
          .clip(CircleShape)
          .background(ComposeColor(0x1F2B84FF)),
    )
  }
}

@Composable
private fun CirclesHostTheme(content: @Composable () -> Unit) {
  MaterialTheme(
    colorScheme =
      darkColorScheme(
        primary = ComposeColor(0xFF38E0C1),
        secondary = ComposeColor(0xFF7BA2FF),
        surface = ComposeColor(0xFF10273A),
        background = ComposeColor(0xFF04101C),
        onPrimary = ComposeColor(0xFF04101C),
        onSurface = ComposeColor.White,
        onBackground = ComposeColor.White,
      ),
    content = content,
  )
}
