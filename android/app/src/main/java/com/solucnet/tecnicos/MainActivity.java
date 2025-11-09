package com.solucnet.tecnicos;

import android.os.Bundle;
import android.widget.Toast;
import android.view.WindowManager;
import android.os.Build;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.appcompat.app.AlertDialog;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private long backPressedTime = 0;
    private static final int BACK_PRESS_INTERVAL = 2000; // 2 segundos

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configurar la ventana para respetar los insets del sistema (status bar, navigation bar)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Hacer que la status bar sea transparente pero con contenido oscuro
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);

            // Configurar el color de los iconos de la status bar
            WindowInsetsControllerCompat windowInsetsController =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (windowInsetsController != null) {
                // true = iconos oscuros (para fondo claro), false = iconos claros (para fondo oscuro)
                windowInsetsController.setAppearanceLightStatusBars(true);
            }
        }

        // Habilitar debugging de WebView para inspeccionar desde Chrome
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            android.webkit.WebView.setWebContentsDebuggingEnabled(true);
        }
    }


    @Override
    public void onStart() {
        super.onStart();

        android.util.Log.d("MainActivity", "========== CONFIGURANDO WEBVIEW ==========");

        // Aplicar WebViewClient personalizado que acepta certificados SSL
        getBridge().getWebView().setWebViewClient(new SSLWebViewClient(getBridge()));
        android.util.Log.d("MainActivity", "✅ SSLWebViewClient configurado");

        // CRÍTICO: Configurar WebView para persistir localStorage
        // Sin esto, localStorage se borra al cerrar la app
        // IMPORTANTE: Configurar DESPUÉS de inicializar el bridge y ANTES de cargar contenido
        android.webkit.WebSettings webSettings = getBridge().getWebView().getSettings();

        // Habilitar DOM Storage (necesario para localStorage)
        webSettings.setDomStorageEnabled(true);
        android.util.Log.d("MainActivity", "✅ DomStorage habilitado: " + webSettings.getDomStorageEnabled());

        // Habilitar Database (necesario para IndexedDB)
        webSettings.setDatabaseEnabled(true);
        android.util.Log.d("MainActivity", "✅ Database habilitado: " + webSettings.getDatabaseEnabled());

        // Configurar directorio de datos persistente (solo para Android antiguo)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
            String databasePath = getApplicationContext().getDir("database", MODE_PRIVATE).getPath();
            webSettings.setDatabasePath(databasePath);
            android.util.Log.d("MainActivity", "✅ Database path: " + databasePath);
        }

        // Configurar modo de cache (sin usar métodos deprecados)
        webSettings.setCacheMode(android.webkit.WebSettings.LOAD_DEFAULT);
        android.util.Log.d("MainActivity", "✅ Cache mode: " + webSettings.getCacheMode());

        // CRÍTICO: Habilitar mixed content (HTTP + HTTPS)
        webSettings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        android.util.Log.d("MainActivity", "✅ Mixed content mode: " + webSettings.getMixedContentMode());

        // Habilitar JavaScript (necesario para la app)
        webSettings.setJavaScriptEnabled(true);
        android.util.Log.d("MainActivity", "✅ JavaScript habilitado: " + webSettings.getJavaScriptEnabled());

        // Permitir acceso a archivos (para fotos offline)
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        android.util.Log.d("MainActivity", "✅ File/Content access habilitado");

        // Habilitar zoom (útil para debugging)
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);

        // User Agent (opcional - para identificar la app)
        String userAgent = webSettings.getUserAgentString();
        webSettings.setUserAgentString(userAgent + " SolucNetTecnicos/1.0");
        android.util.Log.d("MainActivity", "✅ User Agent: " + webSettings.getUserAgentString());

        android.util.Log.d("MainActivity", "========== WEBVIEW CONFIGURADO ==========");
    }

    @Override
    public void onBackPressed() {
        // Si están en la página principal (login o visitas), manejar doble presión
        if (shouldShowExitDialog()) {
            long currentTime = System.currentTimeMillis();

            if (currentTime - backPressedTime < BACK_PRESS_INTERVAL) {
                // Segunda presión dentro del intervalo - mostrar diálogo
                showExitDialog();
            } else {
                // Primera presión - mostrar toast
                backPressedTime = currentTime;
                Toast.makeText(this, "Presiona atrás nuevamente para salir", Toast.LENGTH_SHORT).show();
            }
        } else {
            // En otras páginas, comportamiento normal
            super.onBackPressed();
        }
    }

    private boolean shouldShowExitDialog() {
        // Verificar si estamos en una página principal
        String url = getBridge().getWebView().getUrl();
        return url != null && (
            url.contains("login_tecnicos.html") ||
            url.contains("tecnicos_visitas.html") ||
            url.endsWith("/")
        );
    }

    private void showExitDialog() {
        new AlertDialog.Builder(this)
            .setTitle("Salir de la aplicación")
            .setMessage("¿Deseas cerrar SolucNet Técnicos?")
            .setPositiveButton("Salir", (dialog, which) -> {
                finishAffinity(); // Cierra completamente la app
            })
            .setNegativeButton("Cancelar", (dialog, which) -> {
                dialog.dismiss();
                backPressedTime = 0; // Reset del contador
            })
            .setCancelable(true)
            .show();
    }
}
