package com.wimmich.app.ui.login

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.wimmich.app.di.ViewModelFactory
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun LoginScreen(viewModelFactory: ViewModelFactory, onLoggedIn: () -> Unit) {
    val viewModel: LoginViewModel = viewModel(factory = viewModelFactory)

    LaunchedEffect(viewModel.state) {
        if (viewModel.state is LoginState.Success) onLoggedIn()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text("Wimmich", style = MaterialTheme.typography.headlineMedium)
        Text("Connect to your self-hosted server", style = MaterialTheme.typography.bodyMedium)

        androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 24.dp))

        OutlinedTextField(
            value = viewModel.serverUrl,
            onValueChange = { viewModel.serverUrl = it },
            label = { Text("Server URL (e.g. http://192.168.1.50:3000)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = viewModel.email,
            onValueChange = { viewModel.email = it },
            label = { Text("Email") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        )
        OutlinedTextField(
            value = viewModel.password,
            onValueChange = { viewModel.password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        )

        androidx.compose.foundation.layout.Spacer(Modifier.padding(top = 16.dp))

        when (val state = viewModel.state) {
            is LoginState.LoggingIn -> Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                CircularProgressIndicator()
            }
            is LoginState.Error -> Text(state.message, color = MaterialTheme.colorScheme.error)
            else -> {}
        }

        Button(onClick = { viewModel.login() }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
            Text("Log In")
        }
    }
}
