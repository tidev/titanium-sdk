#! /usr/bin/env ruby

print("<html><head><title>Android 1.5 Icons</title></head><body><table>\n")
`ls -1 ic_*.png`.each do |n|
	print("<tr><td>#{n}</td><td><img src='#{n}'/></td></tr>\n")
end
print("</table></body></html>\n")
