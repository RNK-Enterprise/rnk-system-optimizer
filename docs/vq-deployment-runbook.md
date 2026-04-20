# RNK System Optimizer — Vortex Quantum Deployment Runbook

This runbook turns the topology note into an operator-friendly checklist for keeping the Foundry stack separate from the LISA / Atlas business stack.

## Operating model

- **VQ master is the only browser-facing entry point.**
- **The master lives on the homelab server.**
- **Workers stay private.** They do not get public tunnels in the normal deployment.
- **LISA / Atlas remains on its own ingress and service namespace.**
- **Separate the stacks by hostname, port range, and tunnel configuration.**

## Recommended network layout

### Vortex Quantum stack

- Master: `vq-master`
  - homelab host
  - public HTTPS ingress
  - port `9876`
  - receives Foundry traffic
- Workers on OCI instances
  - one worker per OCI instance
  - private only
- Worker on Hetzner
  - private only
  - reachable only from the master or the private overlay

### LISA / Atlas stack

- Keep the business stack on its own hostname, tunnel, and port namespace.
- Do not reuse the VQ ingress path for LISA services.
- Keep the LISA ports and service names distinct so ops work can target the right stack quickly.

## Tunnel guidance

### Recommended default

- One public tunnel to the VQ master only.
- No public tunnels to workers.
- Optional private mesh or VPN between hosts if workers are not on the same box.

### If workers are on the same machine as the master

- Bind worker ports to localhost or the private host interface.
- Let the master talk to them over loopback or the local network.
- Avoid exposing worker ports in the tunnel config.

### If workers are on separate hosts

- Use a private network overlay such as WireGuard, Tailscale, or an internal VLAN.
- Keep worker access authenticated and non-public.
- Use the master as the stable API contract for the module.

## Port plan

| Service | Suggested port | Exposure |
| --- | ---: | --- |
| VQ master | `9876` | Public HTTPS tunnel on homelab |
| OCI workers | private | Private only |
| Hetzner worker | private | Private only |
| LISA | `9877` | Separate stack / separate ingress |

## Operator checklist

1. Confirm the VQ master on the homelab server is the only endpoint in the Foundry-facing tunnel.
2. Confirm the OCI workers and Hetzner worker service are not published publicly.
3. Confirm the LISA / Atlas stack uses a separate ingress and hostname.
4. Confirm the module’s configured API URL points to the VQ master hostname.
5. Confirm the master can reach the OCI workers and Hetzner worker over the private path.
6. Confirm no worker service is reachable from the browser without going through the master.

## Failure rules

- If a worker becomes unreachable, restart the worker or rejoin the private overlay.
- If the master is down, Foundry should lose only the VQ entry point, not the entire business stack.
- If the public tunnel ever exposes a worker, remove that ingress immediately.

## Related docs

- `docs/vq-deployment-topology.md`
- `docs/current-system-setup.md`
- `SERVICES_MANIFEST.md`
- `README.md`
