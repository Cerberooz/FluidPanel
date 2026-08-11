<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="robots" content="noindex">
        <title>Server Error - {{ config('app.name', 'Fluid') }}</title>
        <link rel="icon" type="image/jpeg" href="/favicons/flux_logo.jpg">
        <style>
            :root { color-scheme: dark; }
            * { box-sizing: border-box; }
            html, body { min-height: 100%; margin: 0; }
            body {
                display: grid;
                place-items: center;
                padding: 24px;
                background: linear-gradient(180deg, #0b0d12 0%, #0e1118 45%, #0b0d12 100%);
                color: #e5e7eb;
                font-family: "IBM Plex Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
            .error-card {
                width: min(100%, 520px);
                padding: 40px;
                text-align: center;
                background: #141923;
                border: 1px solid #374151;
                border-radius: 16px;
                box-shadow: 0 24px 70px rgba(0, 0, 0, .34);
            }
            .logo {
                width: 64px;
                height: 64px;
                border: 1px solid #4b5563;
                border-radius: 14px;
                object-fit: cover;
            }
            .code {
                display: inline-block;
                margin-top: 28px;
                padding: 5px 11px;
                color: #a5f3fc;
                background: #0b0d12;
                border: 1px solid #374151;
                border-radius: 999px;
                font-size: 13px;
                font-weight: 700;
                letter-spacing: .12em;
            }
            h1 { margin: 16px 0 8px; color: #f9fafb; font-size: 30px; }
            p { margin: 0 auto; max-width: 390px; color: #9ca3af; line-height: 1.6; }
            .actions { display: flex; justify-content: center; gap: 12px; margin-top: 28px; }
            .button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 42px;
                padding: 0 18px;
                color: #f9fafb;
                background: #1f2937;
                border: 1px solid #4b5563;
                border-radius: 8px;
                text-decoration: none;
                cursor: pointer;
            }
            .button:hover { background: #374151; border-color: #6b7280; }
            .button.primary { border-color: #0891b2; }
            @media (max-width: 480px) {
                .error-card { padding: 30px 22px; }
                .actions { flex-direction: column; }
            }
        </style>
    </head>
    <body>
        <main class="error-card">
            <img class="logo" src="/favicons/flux_logo.jpg" alt="Fluid">
            <div><span class="code">ERROR 500</span></div>
            <h1>Something went wrong</h1>
            <p>The panel could not complete this request. Try again, or return to the dashboard while the issue is investigated.</p>
            <div class="actions">
                <button class="button" type="button" onclick="window.location.reload()">Try again</button>
                <a class="button primary" href="/">Return to dashboard</a>
            </div>
        </main>
    </body>
</html>
