---
name: create${data["proxy_name"].split(".")[-1]}
summary: Creates and returns an instance of <${data["proxy_name"]}>.
parameters:
  - name: parameters
    type: Dictionary<${data["proxy_name"]}>
    summary: (Optional) Properties as defined in <${data["proxy_name"]}>.
returns:
    type: ${data["proxy_name"]}
% if "platforms" in data:
platforms: ${data["platforms"]}
% endif
% if "since" in data:
since: ${data["since"]}
% endif 
