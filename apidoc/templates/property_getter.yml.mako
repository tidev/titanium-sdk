---
name: get${data.name[0].upper()}${data.name[1:]}
summary: Gets the value of the [${data.api_obj["name"]}](${data.parent.name}.${data.name}) property.
returns: ${data.api_obj["returns_for_getter_template"]}
% if "platforms" in data.api_obj:
platforms: ${data.api_obj["platforms"]}
% endif
% if "since" in data.api_obj:
since: ${data.api_obj["since_for_getter_template"]}
% endif 
