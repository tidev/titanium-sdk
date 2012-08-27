---
name: create${data["proxy_name"].split(".")[-1]}
summary: Creates and returns an instance of <${data["proxy_name"]}>.
parameters:
  - name: parameters
    type: Dictionary<${data["proxy_name"]}>
    summary: Properties to set on a new object, including any defined by <${data["proxy_name"]}> except those marked not-creation or read-only.
    optional: true
returns:
    type: ${data["proxy_name"]}
% if "platforms" in data:
platforms: ${data["platforms"]}
% endif
% if "since" in data:
since: ${data["since"]}
% endif
% if "deprecated" in data:
deprecated: ${data["deprecated"]}
% endif
