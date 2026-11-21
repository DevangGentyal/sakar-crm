#!/usr/bin/env bash

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

run_macos_terminal() {
  local title="$1"
  local directory="$2"
  local command_to_run="$3"
  local launcher="$TMPDIR/karyaa-${title// /-}.command"

  cat > "$launcher" <<EOF
#!/usr/bin/env bash
cd "$PROJECT_ROOT/$directory" || exit 1
clear
echo "=== $title ==="
echo "Directory: $PROJECT_ROOT/$directory"
echo
$command_to_run
exit_code=\$?
echo
echo "Process exited with code \$exit_code"
exec bash -l
EOF

  chmod +x "$launcher"
  open -a Terminal "$launcher"
}

start_ngrok_tunnels() {
  if ! command -v ngrok >/dev/null 2>&1; then
    echo "ngrok is not installed."
    echo "Install it with: brew install ngrok/ngrok/ngrok"
    return 1
  fi

  if [[ -f "$PROJECT_ROOT/.ngrok-backend.pid" ]]; then
    kill "$(cat "$PROJECT_ROOT/.ngrok-backend.pid")" 2>/dev/null || true
  fi
  if [[ -f "$PROJECT_ROOT/.ngrok-frontend.pid" ]]; then
    kill "$(cat "$PROJECT_ROOT/.ngrok-frontend.pid")" 2>/dev/null || true
  fi

  cat > "$PROJECT_ROOT/.ngrok-karyaa.yml" <<'NGROK_CONFIG'
version: "2"
tunnels:
  frontend:
    proto: http
    addr: 3000
NGROK_CONFIG

  local ngrok_auth_config=""
  if [[ "$(uname -s)" == "Darwin" ]]; then
    ngrok_auth_config="$HOME/Library/Application Support/ngrok/ngrok.yml"
  else
    ngrok_auth_config="$HOME/.config/ngrok/ngrok.yml"
  fi

  nohup ngrok start --all --log=stdout \
    --config "$PROJECT_ROOT/.ngrok-karyaa.yml" \
    --config "$ngrok_auth_config" \
    > "$PROJECT_ROOT/.ngrok.log" 2>&1 &
  echo $! > "$PROJECT_ROOT/.ngrok.pid"

  echo "Waiting for ngrok tunnels..."
  local attempt
  for attempt in {1..20}; do
    TUNNEL_JSON=$(curl -fsS http://127.0.0.1:4040/api/tunnels 2>/dev/null || true)
    FRONTEND_URL=$(printf '%s' "$TUNNEL_JSON" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const d=JSON.parse(s||"{\"tunnels\":[]}");const t=d.tunnels.find(x=>String(x.config?.addr).endsWith(":3000"));process.stdout.write(t?.public_url||"")})')

    if [[ -n "$FRONTEND_URL" ]]; then
      return 0
    fi
    sleep 1
  done

  echo "ngrok tunnels did not start. Check authentication and logs:"
  echo "  $PROJECT_ROOT/.ngrok.log"
  return 1
}

echo "==================================================="
echo "Starting KARYAA CRM with local ngrok tunnels"
echo "==================================================="

if start_ngrok_tunnels; then
  export PUBLIC_BASE_URL="$FRONTEND_URL"
  export NEXT_PUBLIC_API_URL="$FRONTEND_URL/api"
  export CORS_ORIGIN="http://localhost:3000,$FRONTEND_URL"
  export FRONTEND_URL="$FRONTEND_URL"

  echo "Frontend and API HTTPS: $FRONTEND_URL"
  echo "Backend is proxied at:    $FRONTEND_URL/api"
  echo "CRM Meta callback:        $FRONTEND_URL/api/v1/webhooks/meta/<integration-key>"

  if [[ "$(uname -s)" == "Darwin" ]]; then
    run_macos_terminal "KARYAA Backend" "backend" "PUBLIC_BASE_URL='$FRONTEND_URL' CORS_ORIGIN='http://localhost:3000,$FRONTEND_URL' FRONTEND_URL='$FRONTEND_URL' npm run dev"
    run_macos_terminal "KARYAA Frontend" "frontend" "NEXT_PUBLIC_API_URL='$FRONTEND_URL/api' npm run dev"
  else
    gnome-terminal --title="KARYAA Backend" -- bash -lc "cd '$PROJECT_ROOT/backend' && PUBLIC_BASE_URL='$FRONTEND_URL' CORS_ORIGIN='http://localhost:3000,$FRONTEND_URL' FRONTEND_URL='$FRONTEND_URL' npm run dev" 2>/dev/null || true
    gnome-terminal --title="KARYAA Frontend" -- bash -lc "cd '$PROJECT_ROOT/frontend' && NEXT_PUBLIC_API_URL='$FRONTEND_URL/api' npm run dev" 2>/dev/null || true
  fi
else
  if [[ "$(uname -s)" == "Darwin" ]]; then
    run_macos_terminal "KARYAA Backend" "backend" "npm run dev"
    run_macos_terminal "KARYAA Frontend" "frontend" "npm run dev"
  else
    gnome-terminal --title="KARYAA Backend" -- bash -lc "cd '$PROJECT_ROOT/backend' && npm run dev" 2>/dev/null || true
    gnome-terminal --title="KARYAA Frontend" -- bash -lc "cd '$PROJECT_ROOT/frontend' && NEXT_PUBLIC_API_URL='http://localhost:4000/api' npm run dev" 2>/dev/null || true
  fi
fi

if [[ "$(uname -s)" == "Darwin" ]]; then
  exit 0
fi

echo "Local backend:  http://localhost:4000"
echo "Local frontend: http://localhost:3000"
