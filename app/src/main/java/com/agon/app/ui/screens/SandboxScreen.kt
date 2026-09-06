package com.agon.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.MenuAnchorType
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.agon.app.data.db.entity.SandboxEntity
import com.agon.app.data.model.LinuxDistro
import com.agon.app.data.model.SandboxStatus
import com.agon.app.di.AppContainer
import com.agon.app.ui.components.EmptyState
import com.agon.app.ui.components.MonoText
import com.agon.app.ui.components.StatusChip
import com.agon.app.viewmodel.SandboxViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SandboxScreen(
    container: AppContainer,
    onOpenTerminal: (sessionId: Long) -> Unit,
) {
    val vm: SandboxViewModel = viewModel(factory = SandboxViewModel.Factory(container))
    val state by vm.uiState.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    var showCreate by remember { mutableStateOf(false) }

    LaunchedEffect(state.message, state.error) {
        state.message?.let {
            snackbar.showSnackbar(it)
            vm.clearMessage()
        }
        state.error?.let {
            snackbar.showSnackbar(it)
            vm.clearMessage()
        }
    }

    LaunchedEffect(state.lastOpenedSessionId) {
        state.lastOpenedSessionId?.let { sid ->
            onOpenTerminal(sid)
            vm.consumeNavigation()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Sandbox Controller", fontWeight = FontWeight.Bold)
                        Text(
                            "Local ProcessExecutor · 30s timeout",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbar) },
        floatingActionButton = {
            FloatingActionButton(onClick = { showCreate = true }) {
                Icon(Icons.Default.Add, contentDescription = "Create sandbox")
            }
        },
    ) { padding ->
        if (state.sandboxes.isEmpty() && !state.isBusy) {
            EmptyState(
                icon = Icons.Default.Dns,
                title = "No sandboxes",
                subtitle = "Create an Alpine/Debian/Ubuntu workspace under the app-private sandbox root.",
                emptyModifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                if (state.isBusy) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                            Text("Working…", style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
                items(state.sandboxes, key = { it.id }) { sb ->
                    SandboxCard(
                        sandbox = sb,
                        busy = state.isBusy,
                        onInit = { vm.initialize(sb.id) },
                        onStop = { vm.stop(sb.id) },
                        onDestroy = { vm.destroy(sb.id) },
                        onTerminal = { vm.openTerminal(sb.id) },
                    )
                }
                item { Spacer(Modifier.height(72.dp)) }
            }
        }
    }

    if (showCreate) {
        CreateSandboxDialog(
            onDismiss = { showCreate = false },
            onCreate = { name, distro ->
                vm.create(name, distro)
                showCreate = false
            },
        )
    }
}

@Composable
private fun SandboxCard(
    sandbox: SandboxEntity,
    busy: Boolean,
    onInit: () -> Unit,
    onStop: () -> Unit,
    onDestroy: () -> Unit,
    onTerminal: () -> Unit,
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceContainer,
        ),
        shape = RoundedCornerShape(16.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(sandbox.name, fontWeight = FontWeight.Bold)
                    Text(
                        sandbox.linuxDistro.displayName,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                StatusChip(sandbox.status)
            }
            Spacer(Modifier.height(8.dp))
            MonoText(
                sandbox.storagePath,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
            )
            if (!sandbox.lastError.isNullOrBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    sandbox.lastError,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error,
                )
            }
            Text(
                "Active sessions: ${sandbox.activeSessionCount}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 4.dp),
            )
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                when (sandbox.status) {
                    SandboxStatus.CREATED, SandboxStatus.STOPPED, SandboxStatus.ERROR -> {
                        FilledTonalButton(onClick = onInit, enabled = !busy) {
                            Icon(Icons.Default.PlayArrow, null, Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Init")
                        }
                    }
                    SandboxStatus.RUNNING -> {
                        OutlinedButton(onClick = onStop, enabled = !busy) {
                            Icon(Icons.Default.Stop, null, Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Stop")
                        }
                    }
                }
                Button(
                    onClick = onTerminal,
                    enabled = !busy && sandbox.status != SandboxStatus.ERROR,
                ) {
                    Icon(Icons.Default.Terminal, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("CLI")
                }
                OutlinedButton(onClick = onDestroy, enabled = !busy) {
                    Icon(Icons.Default.DeleteForever, null, Modifier.size(18.dp))
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreateSandboxDialog(
    onDismiss: () -> Unit,
    onCreate: (String, LinuxDistro) -> Unit,
) {
    var name by remember { mutableStateOf("") }
    var distro by remember { mutableStateOf(LinuxDistro.ALPINE) }
    var expanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Create sandbox") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    "Creates a private directory under cache/sandbox/ and runs a real shell smoke test.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
                    OutlinedTextField(
                        value = distro.displayName,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Linux distro target") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                        modifier = Modifier
                            .menuAnchor(MenuAnchorType.PrimaryNotEditable)
                            .fillMaxWidth(),
                    )
                    ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        LinuxDistro.entries.forEach { d ->
                            DropdownMenuItem(
                                text = { Text(d.displayName) },
                                onClick = {
                                    distro = d
                                    expanded = false
                                },
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onCreate(name, distro) },
                enabled = name.isNotBlank(),
            ) { Text("Create & initialize") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        },
    )
}
