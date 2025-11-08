package com.solucnet.tecnicos;

import android.net.http.SslError;
import android.webkit.SslErrorHandler;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class SSLWebViewClient extends WebViewClient {
    @Override
    public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
        // IMPORTANTE: Solo para desarrollo/uso interno
        // Acepta todos los certificados SSL (incluso autofirmados)
        handler.proceed();
    }
}
