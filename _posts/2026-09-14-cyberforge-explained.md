---
layout: post
title: "Manufacturing bugs that survive the test suite: CyberForge explained"
description: "How CyberForge injects execution-verified vulnerabilities into real C/C++ repositories, and what training on them does to a security agent."
date: 2026-09-14 12:00:00
tags: security agents datasets nist
categories: research
thumbnail: assets/img/papers/cyberforge/hero.png
related_posts: false
toc:
  beginning: true
---

Attackers have an easier job than defenders. An attacker needs one exploitable weakness and can keep trying; a defender has to keep an entire codebase secure, all the time. Agentic systems have started finding real vulnerabilities in real software, which makes that asymmetry worse unless defenders get agents of their own that they can deploy and adapt.

The bottleneck is training data. Software-engineering agents jumped by double digits once someone packaged thousands of real repositories with reproducible build and test environments. Security agents never got that, and the reason is subtle: a functional bug is easy to verify because a test fails. A security weakness is the opposite. It has to survive the test suite and only show up under a crafted input. Existing runnable datasets are built from disclosed CVEs, which caps them at the rate humans find and publish bugs, and most are meant for evaluation rather than training.

CyberForge is our attempt to build that pipeline. I worked on it with Amine Lbath and colleagues during a NIST PREP fellowship in spring 2026, together with Dinesh Manocha at UMD. Amine and I share first authorship.

## The idea

Instead of mining vulnerabilities, create them. Take a real C or C++ project with a working build and test suite, have an LLM agent introduce a weakness, and then check it by execution, not by reading the diff. Two conditions decide whether an instance is admitted. The injected build must still pass every one of the project's own unit tests, so the weakness is latent. And a proof-of-vulnerability (PoV) input must trigger on the injected build and not on the clean one. Neither the injection nor the PoV means anything without the other, so the oracle validates them jointly.

Because instances are created rather than mined, corpus growth no longer depends on disclosure.

## How it works

{% include figure.html path="assets/img/papers/cyberforge/hero.png" class="img-fluid rounded z-depth-1" zoomable=true caption="OSS-Fuzz projects feed two injection pipelines. A shared differential oracle keeps only pairs where the clean build does not crash, the injected build does, and the unit tests still pass. Validated pairs become agent tasks; teacher trajectories over them fine-tune student models." %}

We start from projects in OSS-Fuzz, which already ship Docker images with build scripts, sanitizers, and fuzz harnesses. A project qualifies only if its tests pass at 100% across five unattended runs on unmodified code. That gave us 100 projects; 80 ended up contributing instances.

Two pipelines feed the oracle. The fuzzer-guided pipeline mines OSS-Fuzz coverage metadata to find functions that are security-relevant and reachable from an existing harness, scores them by role and triggerability, and hands an agent one site with tight edit constraints: one minimal change that weakens an existing check. The agent writes a deterministic PoV, and a post-hoc libFuzzer run with format-aware seeds provides a second chance at a trigger.

The agentic pipeline reaches sites no harness covers. Candidates come from retrieval against known CVE functions in PrimeVul (structural and semantic similarity fused together) and from specialist agents exploring the codebase by weakness family. Each target carries its CWE and its CodeQL-recovered dataflow. After injection, taint analysis finds attacker-controlled paths to the site, and a PoV stage uses sanitizer reports and clean-versus-injected differences to build a trigger, with retry loops when it fails.

Validated pairs become SEC-bench-style tasks. Teacher agents (GPT-5.4-mini and Gemma 4 31B) run in the project container with no network and no reference patch, success is decided by the oracle rather than the agent's own claim, and only successful trajectories are used to fine-tune Gemma 4 students at E4B, 12B, and 31B.

## What we found

- 16,172 injection attempts produced 1,034 validated vulnerabilities across 80 projects and 63 CWE categories. Writing a plausible injection is easy; a naive single-pass agent passes unit tests 68.2% of the time and validation 0% of the time. The full workflow takes validated yield to 7.5%.
- On SEC-bench, all six student-teacher pairs improve, by 3.3 to 14.7 points. Gemma 4 31B goes from 58.0% to 72.7% under a GPT-5.4-mini teacher, within 1.3 points of the teacher. The 12B student roughly doubles, from 8.7% to 16.7%.
- The corpus is entirely C/C++, yet every configuration also improves on PatchEval, which is Go, JavaScript, and Python. The 31B student reaches 14.8% strict against its teacher's 13.0%.
- The injected edits look like real patches: the Kolmogorov-Smirnov distance to real SEC-bench CVE edits is 0.165, under the 0.190 floor between two real CVE corpora.

What changed in the agents was as interesting as the scores. The 12B base model edits blindly, completing an edit-then-verify cycle on 20.7% of instances. After fine-tuning that rises to 82.7%, and its gain comes almost entirely from reaching the verification stage at all.

## Try it

- Paper page on this site: [/papers/cyberforge/](/papers/cyberforge/)
- arXiv: [2608.06471](https://arxiv.org/abs/2608.06471)
- Code: [github.com/Cyb3rForge/CyberForge](https://github.com/Cyb3rForge/CyberForge)
- Data: [cyberforge-projects on Hugging Face](https://huggingface.co/datasets/AmL-hug/cyberforge-projects)
- Project page: [cyb3rforge.github.io](https://cyb3rforge.github.io/)
- UMD CS wrote about the project: [When AI Goes on Defense](https://www.cs.umd.edu/article/2026/09/when-ai-goes-defense)
