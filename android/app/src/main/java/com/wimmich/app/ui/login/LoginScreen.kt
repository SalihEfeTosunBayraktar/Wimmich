package com.wimmich.app.ui.login

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.wimmich.app.R
import com.wimmich.app.di.ViewModelFactory
import androidx.lifecycle.viewmodel.compose.viewModel

/**
 * Mirrors the web app's own login screen (static/index.html's .auth-screen/
 * .auth-container/.auth-logo) rather than a plain default Material form -
 * a soft accent-tinted gradient background behind a centered "glass" card,
 * with the same PNG logo (static/icon-192.png / drawable/wimmich_logo.png)
 * the web app and the Android launcher icon both use.
 */
@Composable
fun LoginScreen(viewModelFactory: ViewModelFactory, onLoggedIn: () -> Unit) {
    val viewModel: LoginViewModel = viewModel(factory = viewModelFactory)

    LaunchedEffect(viewModel.state) {
        if (viewModel.state is LoginState.Success) onLoggedIn()
    }

    val bg = MaterialTheme.colorScheme.background
    val accent = MaterialTheme.colorScheme.primary

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(accent.copy(alpha = 0.10f), bg),
                    radius = 900f,
                )
            )
            .padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f),
            shadowElevation = 12.dp,
        ) {
            Column(
                modifier = Modifier.padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Image(
                    painter = painterResource(id = R.drawable.wimmich_logo),
                    contentDescription = "Wimmich",
                    modifier = Modifier
                        .size(88.dp)
                        .clip(RoundedCornerShape(20.dp)),
                )

                androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 12.dp))
                Text("Wimmich", style = MaterialTheme.typography.headlineMedium)
                Text(
                    "Kendi sunucunuza bağlanın",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 24.dp))

                OutlinedTextField(
                    value = viewModel.serverUrl,
                    onValueChange = { viewModel.serverUrl = it },
                    label = { Text("Sunucu adresi (örn. http://192.168.1.50:3000)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = viewModel.email,
                    onValueChange = { viewModel.email = it },
                    label = { Text("E-posta") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                )
                OutlinedTextField(
                    value = viewModel.password,
                    onValueChange = { viewModel.password = it },
                    label = { Text("Şifre") },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                )

                androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 16.dp))

                when (val state = viewModel.state) {
                    is LoginState.LoggingIn -> CircularProgressIndicator()
                    is LoginState.Error -> Text(state.message, color = MaterialTheme.colorScheme.error)
                    else -> {}
                }

                Button(
                    onClick = { viewModel.login() },
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                ) {
                    Text("Giriş Yap")
                }
            }
        }
    }
}
