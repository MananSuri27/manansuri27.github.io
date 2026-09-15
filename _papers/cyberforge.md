---
layout: paper
title: "CyberForge: Verified Vulnerability Injection at Repository Level for Cybersecurity Agent Training"
short_title: "CyberForge"
description: "CyberForge injects execution-verified vulnerabilities into real C/C++ repos to train security agents: 1,034 instances, up to +14.7 on SEC-bench. arXiv, 2026."
bibkey: lbath2026cyberforge
authors:
  - name: Amine Lbath
    equal: true
  - name: Manan Suri
    url: /
    me: true
    equal: true
  - name: Aurélien Delaitre
  - name: Vadim Okun
  - name: Massih-Reza Amini
  - name: Ram D. Sriram
  - name: Dinesh Manocha
    url: https://www.cs.umd.edu/people/dmanocha
affiliations: "National Institute of Standards and Technology; Université Grenoble Alpes, CNRS; University of Maryland, College Park"
venue: "arXiv preprint"
venue_short: "arXiv"
year: 2026
date: 2026-08-06
arxiv: "2608.06471"
pdf: https://arxiv.org/pdf/2608.06471
code: https://github.com/Cyb3rForge/CyberForge
website: https://cyb3rforge.github.io/
dataset: https://huggingface.co/datasets/AmL-hug/cyberforge-projects
hf_paper: https://huggingface.co/papers/2608.06471
blog: /blog/2026/cyberforge-explained/
press:
  - title: "When AI Goes on Defense"
    url: https://www.cs.umd.edu/article/2026/09/when-ai-goes-defense
    outlet: UMD Department of Computer Science
    date: September 2026
figure: /assets/img/papers/cyberforge/hero.png
figure_alt: "CyberForge pipeline in four stages: OSS-Fuzz C/C++ projects feed two injection pipelines (fuzzer-guided and agentic in-context), a shared differential crash oracle validates each candidate, and validated vulnerability-patch pairs are used to collect teacher trajectories that fine-tune a student LLM."
figure_caption: "Overview of CyberForge. Two injection pipelines synthesize candidate vulnerable/patch pairs from OSS-Fuzz C/C++ projects. A shared differential proof-of-vulnerability oracle admits a pair only if the injected build passes the project's own tests and the PoV triggers on the injected build alone. A teacher model then collects verified agent trajectories over the validated instances for supervised fine-tuning."
tldr: "Defensive security agents need training data that barely exists: real repositories with known, reproducible, executable vulnerabilities. CyberForge creates it by injecting weaknesses into real C/C++ projects and keeping only instances that pass the project's unit tests and trigger a proof-of-vulnerability on the injected build alone, yielding 1,034 validated vulnerabilities across 80 projects; fine-tuning on trajectories over this corpus lifts SEC-bench patch repair by 3.3 to 14.7 points in every configuration and transfers to other languages."
highlights:
  - value: "1,034"
    label: "execution-validated vulnerabilities"
  - value: "80"
    label: "real C/C++ projects from OSS-Fuzz"
  - value: "63"
    label: "weakness categories (CWEs)"
  - value: "+14.7"
    label: "points on SEC-bench for the 31B student"
og_image: https://manansuri.com/assets/img/papers/cyberforge/hero.png
---
## Abstract

Despite recent advances, frontier large language model (LLM) agents remain limited in discovering and patching complex vulnerabilities in real-world software. Generally available agents can already aid attackers, who only need to find one exploitable weakness, while defenders must continuously identify and patch all vulnerabilities across fast-growing codebases. Stronger defensive agents would help close this gap, yet the scarcity of security training data with reproducible build and execution environments remains a bottleneck.

We present CyberForge, a framework that synthesizes executable, repository-level security training data by injecting vulnerabilities into real C/C++ projects. It validates each instance dynamically: the injected build must pass the project's unit tests, and a generated proof-of-vulnerability (PoV) must trigger on the injected build and not on the clean one. CyberForge is not limited by the availability of disclosed vulnerabilities, therefore it can scale in comparison to data augmentation techniques which rely on historic CVE data. The resulting corpus holds 1,034 validated vulnerabilities across 80 projects and 63 weakness categories, with edit locality similar to real CVE patches under a real-versus-real noise floor.

Fine-tuning on trajectories collected over this corpus improves SEC-bench patch repair by +3.3 to +14.7 points, in all six configurations of three model scales and two teachers, with the 31B student reaching its GPT-5.4-mini teacher, 72.7% against 74.0%. These gains generalize out of distribution to PatchEval, a corpus containing other programming languages, where every configuration also improves and the 31B student passes its teacher.

## The problem

Agentic systems have started finding real vulnerabilities, and that favors attackers: an attacker needs one exploitable weakness and can retry indefinitely, while a defender has to secure an entire codebase continuously. The balance shifts back only when automated detection and repair become dependable, in models that defenders can deploy and adapt themselves.

Training data is the binding constraint. Software-engineering agents improved by double digits once datasets of packaged repositories with reproducible build and test environments existed. Security has no comparable pipeline because its validation problem is harder: a functional bug fails a test, but a security weakness must stay latent under the existing test suite and surface only under a crafted input. Existing runnable vulnerability datasets are assembled from disclosed CVEs and bug-bounty reports, are mostly built for evaluation, and are capped by the rate of human discovery and disclosure. Capture-the-flag tasks avoid that dependency but transfer poorly to real software, and function-level injection does not produce a runnable project at all.

## Approach

CyberForge targets C and C++ projects enrolled in OSS-Fuzz, which ship per-project Docker images with build scripts, sanitizer configuration, and libFuzzer harnesses. A project enters the pool only if its own test suite builds, runs unattended, and passes at a 100% rate across five runs on the unmodified code; flaky projects are rejected. This left 100 qualified projects, 80 of which contributed at least one validated instance. Two complementary pipelines then inject weaknesses and feed a shared oracle.

- **Pipeline 1, fuzzer-guided injection.** OSS-Fuzz metadata (Fuzz Introspector reports, harness definitions, coverage) is parsed into a reachability map of functions reachable from at least one harness. Each reachable function is scored on structural role, call depth, fanout, and coverage, and on triggerability (parser proximity, guard-to-sink distance, nearby blockers), then diversified across harnesses, roles, and vulnerability categories. An LLM agent is given the site, the inferred weakness type, the harness input format, and category-specific edit constraints, and makes one minimal edit that weakens an existing check. It then writes a deterministic PoV; a post-hoc libFuzzer run with a format-aware seed corpus provides a second path to a confirmed trigger.
- **Pipeline 2, agentic in-context injection.** This pipeline reaches sites beyond existing harnesses. Candidate sites come from hybrid retrieval against PrimeVul CVE functions (AST n-gram structural similarity fused with dense semantic similarity by reciprocal rank fusion, then reranked), which also supplies an aligned secure/vulnerable example as an in-context template, and from planner-directed specialist agents that explore the codebase by weakness family. Each target is specified with its CWE and its CodeQL-recovered call chain and dataflow. After injection, agent-based taint analysis finds attacker-controlled paths to the site, and a PoV stage uses sanitizer reports, side effects, and clean-versus-injected output differences to build a trigger, with retry loops back to PoV generation and then to injection.
- **Differential validation.** Both pipelines converge on two conditions: the injected build must pass every existing unit test, so the weakness is latent, and the PoV must trigger on the injected build and not on the clean build under identical input. A verifier also checks that the sanitizer reports the expected error type at the expected location.
- **Task formation and training.** Validated (vulnerability, patch) pairs become SEC-bench-style tasks. Teacher agents (GPT-5.4-mini and Gemma 4 31B) run on Mini-SWE-Agent inside the project's OSS-Fuzz container with no network access and no access to the reference patch; success is decided by the differential oracle, not the agent's own report. Only successful trajectories are used to fine-tune Gemma 4 E4B, 12B, and 31B students with LoRA (r=32, alpha=64, three epochs on one H200).

<div class="paper-anim">
<svg viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CyberForge: an OSS-Fuzz project feeds a fuzzer-guided and an agentic injection pipeline; a differential crash oracle keeps only candidates that pass unit tests and whose proof of vulnerability triggers on the injected build alone; validated vulnerability-patch pairs become agent tasks whose teacher trajectories fine-tune a student model.">
  <style>
    .n { fill: none; stroke: currentColor; stroke-width: 1.5; }
    .t { fill: currentColor; font-size: 14px; }
    .s { fill: currentColor; font-size: 12px; opacity: 0.75; }
    .acc { stroke: #B509AC; }
    .flow { fill: none; stroke: #B509AC; stroke-width: 2; stroke-dasharray: 6 6; animation: dash 1.2s linear infinite; }
    .pulse { animation: pulse 2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .fade1 { animation: fade 4s ease-in-out infinite; }
    .d1 { animation-delay: 0.4s; } .d2 { animation-delay: 0.8s; } .d3 { animation-delay: 1.2s; } .d4 { animation-delay: 1.6s; }
    @keyframes dash { to { stroke-dashoffset: -24; } }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
    @keyframes fade { 0%,20% { opacity: 0; } 30%,70% { opacity: 1; } 80%,100% { opacity: 0; } }
  </style>
  <defs>
    <marker id="ah2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#B509AC"/>
    </marker>
  </defs>

  <!-- 1. OSS-Fuzz project -->
  <rect class="n" x="20" y="110" width="130" height="110" rx="10"/>
  <text class="t" x="85" y="140" text-anchor="middle">OSS-Fuzz</text>
  <text class="t" x="85" y="158" text-anchor="middle">C/C++ project</text>
  <text class="s" x="85" y="182" text-anchor="middle">Docker build,</text>
  <text class="s" x="85" y="198" text-anchor="middle">tests, harnesses</text>

  <!-- 2a. Pipeline 1 -->
  <rect class="n pulse" x="190" y="40" width="170" height="90" rx="10"/>
  <text class="t" x="275" y="66" text-anchor="middle">P1: fuzzer-guided</text>
  <text class="t" x="275" y="84" text-anchor="middle">injection</text>
  <text class="s" x="275" y="106" text-anchor="middle">harness-reachable site,</text>
  <text class="s" x="275" y="121" text-anchor="middle">one minimal edit</text>

  <!-- 2b. Pipeline 2 -->
  <rect class="n pulse d1" x="190" y="200" width="170" height="90" rx="10"/>
  <text class="t" x="275" y="226" text-anchor="middle">P2: agentic</text>
  <text class="t" x="275" y="244" text-anchor="middle">in-context injection</text>
  <text class="s" x="275" y="266" text-anchor="middle">CVE-retrieved template,</text>
  <text class="s" x="275" y="281" text-anchor="middle">taint analysis, retries</text>

  <!-- 3. Oracle -->
  <rect class="n acc" x="400" y="95" width="170" height="140" rx="10" stroke-width="2"/>
  <text class="t" x="485" y="120" text-anchor="middle">Differential</text>
  <text class="t" x="485" y="138" text-anchor="middle">crash oracle</text>
  <text class="s" x="485" y="162" text-anchor="middle">unit tests still pass</text>
  <text class="s" x="485" y="178" text-anchor="middle">PoV triggers on</text>
  <text class="s" x="485" y="193" text-anchor="middle">injected build only</text>
  <text class="s" x="485" y="215" text-anchor="middle">sanitizer type checked</text>

  <!-- rejected candidates -->
  <path class="flow d2" d="M485,235 L485,272" marker-end="url(#ah2)"/>
  <text class="s fade1" x="485" y="292" text-anchor="middle">rejected: 16,172 attempts</text>
  <text class="s fade1" x="485" y="307" text-anchor="middle">→ 1,034 validated</text>

  <!-- 4. Validated pairs -->
  <rect class="n" x="610" y="110" width="130" height="110" rx="10"/>
  <text class="t" x="675" y="140" text-anchor="middle">Validated</text>
  <text class="t" x="675" y="158" text-anchor="middle">(vuln, patch)</text>
  <text class="s" x="675" y="182" text-anchor="middle">diff + PoV +</text>
  <text class="s" x="675" y="198" text-anchor="middle">sanitizer report</text>

  <!-- 5. Agent SFT -->
  <rect class="n" x="780" y="110" width="105" height="110" rx="10"/>
  <text class="t" x="832" y="140" text-anchor="middle">Agent SFT</text>
  <text class="s" x="832" y="164" text-anchor="middle">teacher runs</text>
  <text class="s" x="832" y="180" text-anchor="middle">patch tasks;</text>
  <text class="s" x="832" y="196" text-anchor="middle">student learns</text>
  <text class="s" x="832" y="212" text-anchor="middle">from successes</text>

  <!-- flows -->
  <path class="flow" d="M150,150 C170,150 170,85 188,85" marker-end="url(#ah2)"/>
  <path class="flow" d="M150,180 C170,180 170,245 188,245" marker-end="url(#ah2)"/>
  <path class="flow d1" d="M360,85 C380,85 380,145 398,145" marker-end="url(#ah2)"/>
  <path class="flow d1" d="M360,245 C380,245 380,185 398,185" marker-end="url(#ah2)"/>
  <path class="flow d2" d="M570,165 L608,165" marker-end="url(#ah2)"/>
  <path class="flow d3" d="M740,165 L778,165" marker-end="url(#ah2)"/>

  <text class="s" x="675" y="70" text-anchor="middle">executable, repository-level tasks</text>
  <text class="s" x="675" y="86" text-anchor="middle">with reproducible builds</text>
</svg>
<div class="anim-caption">Two injection pipelines propose candidate weaknesses in real OSS-Fuzz projects; a differential crash oracle keeps a candidate only if the project's own tests still pass and the proof of vulnerability triggers on the injected build alone, and the surviving (vulnerability, patch) pairs become agent tasks for teacher-trajectory collection and student fine-tuning.</div>
</div>

## Example

One instance from the released corpus, `guetzli/vulnerability_FZ_24` (Appendix E of the paper). Guetzli is Google's JPEG compressor. In `ProcessAPP`, the original code validates a segment's declared length in two steps: `VERIFY_INPUT` checks that it lies in the JPEG-legal range (2 to 65535) and `VERIFY_LEN` checks that the input buffer actually holds that many bytes. CyberForge deletes the second check and nothing else.

<div class="paper-example" markdown="1">
<span class="ex-label">Input: injected edit (inject_vulnerability.diff)</span>
<div class="ex-row" markdown="1">

```diff
diff --git a/guetzli/jpeg_data_reader.cc b/guetzli/jpeg_data_reader.cc
@@ -398,7 +398,7 @@ bool ProcessAPP(const uint8_t* data, size_t* pos, ...)
   VERIFY_LEN(2);
   size_t marker_len = ReadUint16(data, pos);
   VERIFY_INPUT(marker_len, 2, 65535, MARKER_LEN);
-  VERIFY_LEN(marker_len - 2);
+
   // Save the marker type together with the app data.
   std::string app_str(reinterpret_cast<const char*>(
       &data[*pos - 3]), marker_len + 1);
```

```json
{
  "id": "vulnerability_FZ_24",
  "project": "guetzli",
  "producer": "fuzz_poc_guided",
  "cwe_id": "CWE-125",
  "cwe_group": "Post buffer operation",
  "secure_base_commit": "214f2bb42abf5a577c079d00add5d6cc470620d3"
}
```

</div>
<span class="ex-label">Proof of vulnerability</span>
<div class="ex-row" markdown="1">
A 504-byte file that opens with `FF D8 FF E0 FF FF 4A 46 49 46`: `FF D8` is the JPEG start marker, `FF E0` opens an APP0 segment, and `FF FF` declares a segment length of 65,535 bytes, the largest value `VERIFY_INPUT` accepts. Only 504 bytes are present, so the deleted check would have rejected the file; without it, the `std::string` constructor copies from the declared length and reads 65,035 bytes past the end of the input.
</div>
<span class="ex-label">Output: validation outcome</span>
<div class="ex-row" markdown="1">
<span class="ex-good">Accepted.</span> The injected build passes all 10 of Guetzli's unit tests (`"expected_passing_count": 10`), and the PoV triggers on the injected build only, with the sanitizer reporting the expected error type at the expected location:

```text
==432==ERROR: AddressSanitizer: heap-buffer-overflow
READ of size 65531 at 0x6fc93620b1f8 thread T0
    #0 ProcessAPP jpeg_data_reader.cc:403:15
SUMMARY: AddressSanitizer: heap-buffer-overflow
    jpeg_data_reader.cc:403:15 in guetzli::ProcessAPP
```

</div>
</div>

The paper notes that this follows the same pattern as Heartbleed (CVE-2014-0160): an attacker-supplied length larger than the accompanying data. Conforming JPEGs never exercise the missing check, so ordinary unit tests do not catch it, which is exactly the latent-under-tests property the oracle enforces.

## Results

| Model | Teacher | SEC-bench (%) | PatchEval strict (%) | PatchEval PoV (%) |
|---|---|---|---|---|
| GPT-5.4-mini (teacher) | | 74.0 | 13.0 | 15.2 |
| Gemma 4 31B (teacher) | | 58.0 | 12.2 | 14.4 |
| Gemma 4 E4B (base) | | 6.0 | 2.6 | 3.9 |
| **CyberForge-E4B** | Gemma 4 31B | **10.7** (+4.7) | **5.2** (+2.6) | **6.5** (+2.6) |
| **CyberForge-E4B** | GPT-5.4-mini | **9.3** (+3.3) | **9.1** (+6.5) | **10.4** (+6.5) |
| Gemma 4 12B (base) | | 8.7 | 3.9 | 3.9 |
| **CyberForge-12B** | Gemma 4 31B | **16.0** (+7.3) | **6.1** (+2.2) | **8.7** (+4.8) |
| **CyberForge-12B** | GPT-5.4-mini | **16.7** (+8.0) | **12.8** (+8.9) | **14.1** (+10.2) |
| Gemma 4 31B (base) | | 58.0 | 12.2 | 14.4 |
| **CyberForge-31B** | Gemma 4 31B | **64.7** (+6.7) | **12.4** (+0.2) | **15.7** (+1.3) |
| **CyberForge-31B** | GPT-5.4-mini | **72.7** (+14.7) | **14.8** (+2.6) | **16.5** (+2.1) |

<p class="table-note">Source: Table 2 of the paper. SEC-bench (150 C/C++ instances, in-domain) and PatchEval (230 CVEs in Python, JavaScript, and Go, out-of-distribution) report the percentage of instances patched; parentheses give the gain over the corresponding base model. Higher is better.</p>

- **Every configuration improves.** All six student-teacher pairs gain +3.3 to +14.7 points on SEC-bench. Gemma 4 31B under the GPT-5.4-mini teacher rises from 58.0% to 72.7%, within 1.3 points of its teacher; 12B roughly doubles from 8.7% to 16.7%.
- **Self-distillation works.** Students taught by Gemma 4 31B improve at every scale (31B: 64.7%), so the corpus carries signal that does not depend only on a stronger teacher.
- **Out-of-distribution transfer.** On PatchEval every configuration improves on both criteria; the 12B student gains +8.9 strict and +10.2 PoV, and the 31B student reaches 14.8% strict against its teacher's 13.0%.
- **Scaling and complementarity.** With the 12B student and Gemma teacher fixed, SEC-bench rises monotonically from 3.6% to 12.1% to 16.0% as the trajectory corpus doubles twice (at 220 trajectories the student scores below its own base). Running both students and keeping the successful run reaches 18.0%, 25.3%, and 82.0% at E4B, 12B, and 31B.

### The corpus

| Corpus | Count |
|---|---|
| Validated instances | 1,034 |
| Pipeline 1 (fuzzer-guided) | 643 |
| Pipeline 2 (agentic) | 391 |
| OSS-Fuzz projects qualified / contributing at least one instance | 100 / 80 |
| Distinct weakness categories (CWE) / CWE groups | 63 / 25 |
| C++ projects / instances | 73 / 697 |
| C projects / instances | 27 / 337 |

<p class="table-note">Source: Table 4 of the paper. 16,172 injection attempts produced the 1,034 validated instances; teachers yielded 1,194 accepted trajectories from GPT-5.4-mini and 880 from Gemma 4 31B.</p>

| Pipeline 2 workflow ablation | Injected (%) | Validated (%) |
|---|---|---|
| Naive single pass | 68.2 | 0.0 |
| Taint analysis only | 75.5 | 2.8 |
| Retry loops only | 77.6 | 3.5 |
| **Full workflow** | **77.6** | **7.5** |

<p class="table-note">Source: Table 3 of the paper. "Injected" is the share of attempts that compile and pass unit tests; "Validated" is the share that also pass the differential PoV oracle. Higher is better.</p>

- **Validation is the hard part.** A naive agent produces plausible, test-passing injections on 68.2% of attempts but none pass validation; a PoV that never triggers is the largest single failure cause in both pipelines (44.6% and 33.1%).
- **Edits are small and local.** 1,025 of 1,034 instances change a single file and 944 confine the change to one hunk (median 2 lines changed). The Kolmogorov-Smirnov distance between CyberForge edits and real SEC-bench CVE patches is 0.165, below the 0.190 floor between two real CVE corpora.
- **Behavior transfer.** The 12B base completes an edit-verify cycle on 20.7% of instances; after fine-tuning, 82.7%. Format violations for 12B fall from 38 instances to 2 (Gemma teacher) and 0 (GPT teacher).

## Resources

- [arXiv: 2608.06471](https://arxiv.org/abs/2608.06471) and [PDF](https://arxiv.org/pdf/2608.06471)
- [Project page](https://cyb3rforge.github.io/)
- [Code: injection and validation framework](https://github.com/Cyb3rForge/CyberForge) (the CLI and Python package are named `vuljector`)
- [Dataset: cyberforge-projects](https://huggingface.co/datasets/AmL-hug/cyberforge-projects), the 1,034 validated instances, one archive per project, each with `inject_vulnerability.diff`, `vulnerability_metadata.json`, `sanitizer_report.txt`, and `exploit_files/`
- Teacher trajectories: [GPT-5.4-mini](https://huggingface.co/datasets/AmL-hug/cyberforge-teacher-traj-gpt-5.4-mini) and [Gemma 4 31B](https://huggingface.co/datasets/AmL-hug/cyberforge-teacher-traj-gemma4-31b)
- [Hugging Face Papers page](https://huggingface.co/papers/2608.06471)
- [Explainer post](/blog/2026/cyberforge-explained/) on this site
- UMD CS coverage: [When AI Goes on Defense](https://www.cs.umd.edu/article/2026/09/when-ai-goes-defense)
- [All publications](/publications/)

### Quick start

From the repository README (needs Python 3.13+, `uv`, Docker, and API keys in `src/.env`). With the released dataset symlinked as `vuljector-projects/` next to the repo, no OSS-Fuzz clone or `init` step is needed.

```bash
uv pip install -e .            # or: uv sync
cp src/.env.example src/.env   # then add your API keys

vuljector setup <project>      # pulls the prebuilt vuljector/<project>:setup image
vuljector run <project> static_analysis <model_id> --num-vulnerabilities 3
```
