---
layout: page
permalink: /publications/
title: publications
description: Papers by Manan Suri on LLM agents, multimodal attribution, parametric memory, and NLP, at ACL, EMNLP, NAACL, ICLR, and on arXiv. Reverse chronological.
nav: true
nav_order: 1
---
<!-- _pages/publications.md -->
<div class="publications">

{% bibliography -f {{ site.scholar.bibliography }} %}

</div>

{%- capture pubgraph -%}{% bibliography -f {{ site.scholar.bibliography }} -T bib-jsonld -g none %}{%- endcapture -%}
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[{"@type":"Person","@id":"{{ site.url }}/#person","name":"Manan Suri","url":"{{ site.url }}/"}{{ pubgraph | strip_html | strip }}]}
</script>
