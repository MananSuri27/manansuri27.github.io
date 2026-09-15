 module Jekyll
  module HideCustomBibtex
    def hideCustomBibtex(input)
	  keywords = @context.registers[:site].config['filtered_bibtex_keywords']

	  # Only strip lines whose *field name* is a filtered keyword. The old
	  # pattern (/^.*#{keyword}.*$/) matched anywhere on the line, so e.g. the
	  # keyword "code" deleted the "@inproceedings{suri-etal-2026-codescout," line
	  # and left a broken bibtex block.
	  keywords.each do |keyword|
		input = input.gsub(/^\s*#{Regexp.escape(keyword)}\s*=.*$\n?/, '')
	  end

      return input
    end
  end
end

Liquid::Template.register_filter(Jekyll::HideCustomBibtex)
