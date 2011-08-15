---
name: create${data["proxy_name"].split(".")[-1]}
description: Create and return an instance of <${data["proxy_name"]}>.
parameters:
  - name: parameters
    type: Dictionary<${data["proxy_name"]}>
    description: (Optional) A dictionary object with properties as defined in <${data["proxy_name"]}>.
returns:
    type: ${data["proxy_name"]}
% if "platforms" in data:
platforms: ${data["platforms"]}
% endif
% if "since" in data:
since: ${data["since"]}
% endif 
