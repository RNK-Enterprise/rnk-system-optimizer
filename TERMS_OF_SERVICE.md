# RNK SYSTEM OPTIMIZER — TERMS OF SERVICE

**Effective Date:** April 12, 2026  
**Last Updated:** April 12, 2026  
**Version:** 1.0 (Atlas Edition)

---

## 1. ACCEPTANCE & REQUIREMENT

By using the RNK System Optimizer module you agree to these terms in full. If you do not accept these terms, **do not install or use the Software**.

The Software will display this Terms of Service on first load. You must explicitly accept the terms to proceed. Continued use = acceptance.

---

## 2. WHAT THE SOFTWARE DOES

The RNK System Optimizer analyzes your Foundry Virtual Tabletop environment and recommends performance optimizations via the Atlas runtime.

**Process Overview:**

1. **Collection** (First Connection):
   - Module collects system telemetry: CPU cores, RAM, GPU model, network latency to Atlas, Foundry version, active module count
   - Initial connection sends FULL profile to Atlas for analysis

2. **Analysis** (Atlas Side):
   - Atlas analyzes telemetry against 20,662+ certified optimization engines
   - Generates ranked recommendations specific to your system profile
   - **Atlas creates NO permanent record** of your system or recommendations
   - Analysis is stateless — each request is independent

3. **Recommendation** (Your Device):
   - Module receives recommendations as JSON list
   - **Recommendations are stored on your device only** (localStorage)
   - Recommendations are never sent back to Atlas
   - You choose which recommendations to apply, ignore, or delete

4. **Optimization** (Your Choice):
   - Applying a recommendation sends ONE API call to Atlas (dispatch of selected engine)
   - Result is returned immediately
   - Your local audit trail is updated with what you applied
   - **No report is sent back to Atlas about what you did**

5. **Continued Monitoring**:
   - Module continues sending telemetry every 10-30 seconds (configurable)
   - Only **changed metrics** are sent (deltas), not full profile every time
   - User can request fresh full profile at any time via "Reset Baseline" button

---

## 3. DATA TRANSPARENCY

### What Stays On Your Device (100%)

- All telemetry collected from your system
- All recommendations you receive
- Audit trail of every optimization you applied, ignored, or rejected
- Baseline snapshots and delta history
- Module diagnostics (memory usage, errors, module compatibility issues)

**These never leave your device unless you export them.**

### What Goes To Atlas

- System telemetry (CPU, RAM, GPU, network latency, Foundry version, mod count) — for analysis only
- One API call per optimization you apply (library name + flags)
- Timestamp of requests

**That's it. Nothing else.**

### What Atlas Retains

- **Nothing.** Atlas is stateless. Each analysis is independent. No user profiles, no history, no audit trail stored on Atlas.
- Patreon subscription validation is Patreon-side (your subscription provider), not RNK-side
- Requests are logged for debugging only (rotate hourly, no persistent history)

### No Private Data Sent

- Module names of your other mods are NOT sent
- Module descriptions are NOT sent
- Player names are NOT sent
- Campaign data is NOT sent
- Your Foundry database is NOT sent
- You choose what to export; only exported data leaves your device

---

## 4. USER CHOICE & RESPONSIBILITY

**You choose what to do with recommendations.** RNK assumes no responsibility for your choices.

### Recommendation Types (Whitelisted)

Only these recommendation types can be applied:

| Recommendation | What It Does | Your Role |
| --- | --- | --- |
| `set-turbo-mode` | Switch Atlas between `compute` (quality) or `throughput` (speed) | You decide which mode fits your playstyle |
| `adjust-batch-size` | Ask Atlas to process module operations in batches of N | You control batch size, or revert to default |
| `pause-cleanup` | Temporarily skip compendium rebuilds to reduce server load | You decide when to pause or resume |
| `optimize-cache` | Clear Foundry's HTTP cache and refresh indexes | Standard optimization, low risk |
| `shadow-dispatch` | Route a module request to Atlas's shadow (testing) engine variant | Experimental feature, opt-in only |
| `enable-diagnostics` | Log extra telemetry for 5 minutes to diagnose an issue | Verbose logging, then auto-stops |

### What Cannot Happen (Hard-Blocked)

❌ No remote code execution on your system
❌ No file system access (read or write)
❌ No DOM injection or UI modification outside module UI
❌ No stopping/starting of Foundry services
❌ No player or campaign data extraction
❌ No automatic application of changes (always asks you first, you click Apply/Ignore)

### You Accept Responsibility For

- Any performance change (improvement or degradation) after applying a recommendation
- Any compatibility issues between recommendations and your module ecosystem
- The decision to trust Atlas's recommendation or ignore it
- Testing recommendations in a non-critical environment first if you're unsure

---

## 5. AUDIT TRAIL & EXPORT

All of your local history is yours to keep, export, or delete.

### Local Audit Trail Includes

- Baseline snapshot (when created, system profile at time)
- Each optimization recommendation received (timestamp, engine name, flags)
- Each action you took (Applied / Ignored / Deleted timestamp)
- Result delta (before/after metrics)
- Module diagnostics (if problems were detected)

### Export ("Download My Data")

- Click "Export" button
- Checkbox option: Include Atlas recommendations and audit trail? (Yes / No)
- If Yes: All local data + your decisions are included in export file
- If No: Only your baseline snapshot and optimization results (no record of Atlas involvement)
- **Either way, this data never goes to Atlas — it's only saved locally on your device**

### Privacy Control

- You decide whether exported files include Atlas data
- You control who gets access to exported files
- You can delete local audit trail at any time ("Clear All Local Data")
- Deleted data cannot be recovered

---

## 6. SYSTEM DIAGNOSTICS

The module can detect problems in your Foundry environment:

### Problems It Can Detect

- Memory leaks (module using more RAM over time without release)
- Repeated console errors (same error from same module 5+ times)
- GPU memory spikes (if GPU model detected)
- Module incompatibilities (conflicting flags or behavior patterns)
- Network latency spikes (slow responses from Foundry or Atlas)

### How It Reports Them

- Displayed in a "Module Diagnostics" panel within the optimizer UI
- Problems are ranked by severity (memory leak > latency > errors)
- Problems are **never sent to Atlas** — analysis happens locally
- You can click a problem to see history (when it started, frequency)

### Your Options

- Ignore the problem (module continues)
- Request a diagnostic profile (Atlas analyzes the problem module in detail, returns recommendations)
- Export diagnostic data (for debugging or support)

---

## 7. PATREON SUBSCRIPTION VALIDATION

### How It Works

- Your Patreon session is validated on every connection to Atlas
- Validation is cheap (Patreon servers check your subscription status instantly)
- If your session is expired, revoked, or invalid, the module stops connecting to Atlas
- Invalid session = no recommendations, no optimization — module enters safe mode

### If Your Subscription Expires

- Module will no longer connect to Atlas
- All local data (audit trails, baselines, diagnostics) remains yours
- Recommendations already received stay in localStorage until you clear them
- You can reactivate by signing in with a valid Patreon session

### No Data Collected For Patreon Purposes

- RNK does not collect your Patreon user ID
- RNK does not collect your tier level (only that it's valid)
- Patreon validates your own subscription — you control that relationship

---

## 8. FAILURE SCENARIOS

### If Atlas Runtime Is Down

- Module detects connection failure within 5 seconds
- Stops attempting to connect (no retry spam)
- Displays a status indicator: "Atlas Runtime Unavailable"
- Existing recommendations and audit trail remain available locally
- You cannot apply new optimizations until Atlas is back online
- No data is lost

### If Your Network Connection Fails

- Module gracefully stops sending telemetry
- Automatically resumes when connection is restored
- No data is lost

### If Module Crashes

- All local data is persisted in localStorage
- Data survives Foundry restart, browser restart, or device restart
- On next load, module resumes from last known state

### If You Disable The Module

- All local data remains in Foundry's module storage
- Data is accessible if you re-enable the module later
- Data is NOT deleted unless you explicitly clear it

---

## 9. DISCLAIMERS

### Performance Not Guaranteed

RNK does not warrant that recommendations will improve your Foundry performance. Recommendations are based on your system profile and Atlas's analysis, but results depend on:

- Your specific module ecosystem (which others are installed)
- Your hardware capabilities at time of optimization
- Your network conditions
- Your playstyle and campaign needs

Apply recommendations at your own risk, especially in live games.

### Compatibility Not Guaranteed

Some modules may not work well with certain optimization flags. Always test recommendations in a non-critical scene or separate installation first if you're unsure.

### Availability Not Guaranteed

Atlas runtime availability depends on your services server infrastructure. RNK does not provide Atlas hosting, support, or uptime guarantees for your services server. You control your services server — you control availability.

### Data Loss Responsibility

- Always back up your Foundry database before major optimizations
- Audit trails and diagnostics are helpful for debugging, not guaranteed to solve issues
- RNK is not responsible for data loss or corruption resulting from optimization

---

## 10. PROHIBITED USE

You may **not** use the Software to:

- Circumvent Foundry licensing or DRM protections
- Extract or reverse-engineer proprietary module code
- Analyze other users' systems (if module is installed by a GM for players)
- Manipulate campaign data for cheating
- Extract player data or personal information
- Bypass Patreon subscription validation
- Exceed RNK's acceptable use policies (defined by Patreon access revocation)

Violations result in immediate license revocation.

---

## 11. CHANGES TO TERMS

RNK reserves the right to update these terms at any time. Changes will be announced via Patreon before taking effect.

- Non-material clarifications: In effect immediately
- Material changes (new features, data collection, new T&Cs): 30-day notice before enforcement

If you disagree with changes, you may disable the module and delete local data. Continued use after the effective date = acceptance of new terms.

---

## 12. CONTACT & SUPPORT

**Questions about these terms?**  
Email: [Asgardinnovations@protonmail.com](mailto:Asgardinnovations@protonmail.com)  
Patreon: [patreon.com/RagNaroks](https://www.patreon.com/RagNaroks)  
Discord: Odinn1982

**Report a problem?**

- Module error: Check browser console (F12) and export diagnostic data
- Atlas runtime issue: Check services server logs
- Privacy concern: Email immediately with details

---

## 13. ACKNOWLEDGMENT

By clicking "I Agree" on first load, you confirm:

✓ You have read and understood these terms
✓ You accept responsibility for applying or ignoring recommendations
✓ You understand your data stays on your device (unless you export it)
✓ You accept that RNK assumes no liability for performance changes
✓ You agree to maintain an active Patreon subscription to use the Software

**This is a binding agreement.** Continued use after dismissing this dialog = acceptance.
