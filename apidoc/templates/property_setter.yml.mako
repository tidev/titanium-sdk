---
name: set${data.name[0].upper()}${data.name[1:]}
summary: Sets the value of the [${data.api_obj["name"]}](${data.parent.name}.${data.name}) property.
% if "platforms" in data.api_obj:
platforms: ${data.api_obj["platforms"]}
% endif
% if "since" in data.api_obj:
since: ${data.api_obj["since_for_setter_template"]}
% endif 
parameters:
  - name: ${data.name}
    type: ${data.api_obj["type"]}
    summary: New value for the property.

