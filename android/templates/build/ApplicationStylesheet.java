/**
 * Appcelerator Titanium
 * WARNING: This is a generated file.  Do not modify.
 */
package <%- appid %>;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.appcelerator.titanium.TiStylesheet;

import org.appcelerator.kroll.KrollDict;

public final class ApplicationStylesheet extends TiStylesheet
{
	public ApplicationStylesheet()
	{
		super();

<%
function render(obj, varname) {
	obj && Object.keys(obj).forEach(function (pathname) {
		if (Object.keys(obj[pathname]).length) {
			var hashmap = pathname + '_' + varname; -%>
		HashMap<String,KrollDict> <%- hashmap %> = new HashMap<String,KrollDict>();
<%			Object.keys(obj[pathname]).forEach(function (classname) {
				var mapname = pathname + '_' + varname + '_' + classname; -%>
		KrollDict <%- mapname %> = new KrollDict();
		<%- hashmap %>.put("<%- classname %>", <%- mapname %>);
<%				Object.keys(obj[pathname][classname]).forEach(function (property) {
					var value = obj[pathname][classname][property];
					if (value && typeof value == 'object') {
						var dictname = mapname + '_' + property; -%>
		KrollDict <%- dictname %> = new KrollDict();
<%						Object.keys(value).forEach(function (key) { -%>
		<%- dictname %>.put("<%- key %>", "<%- value[key] %>");
<%						}); -%>
		<%- mapname %>.put("<%- property %>", <%- dictname %>);
<%					} else { -%>
		<%- mapname %>.put("<%- property %>", "<%- value %>");
<%					}
				});
			}); -%>
		<%- varname %>.put("<%- pathname %>", <%- hashmap %>);

<%		}
	});
}

function renderDensity(obj, varname) {
	obj && Object.keys(obj).forEach(function (pathname) {
		if (Object.keys(obj[pathname]).length) {
			var hashmap = pathname + '_density_' + varname;
-%>
		HashMap<String,HashMap<String,KrollDict>> <%- hashmap %> = new HashMap<String,HashMap<String,KrollDict>>();
<%			Object.keys(obj[pathname]).forEach(function (density) {
				var densityMapName = pathname + '_density_' + varname + '_' + density;
-%>
		HashMap<String,KrollDict> <%- densityMapName %> = new HashMap<String,KrollDict>();
		<%- hashmap %>.put("<%- density %>", <%- densityMapName %>);
<%				Object.keys(obj[pathname][density]).forEach(function (classname) {
					var mapname = pathname + '_density_' + varname + '_' + density + '_' + classname;
-%>
		KrollDict <%- mapname %> = new KrollDict();
		<%- densityMapName %>.put("<%- classname %>", <%- mapname %>);
<%					Object.keys(obj[pathname][density][classname]).forEach(function (property) {
						var value = obj[pathname][density][classname][property];
						if (value && typeof value == 'object') {
							var dictname = pathname + '_' + varname + '_' + density + '_' + classname + '_' + property;
-%>
		KrollDict <%- dictname %> = new KrollDict();
<%							Object.keys(value).forEach(function (key) {
-%>
		<%- dictname %>.put("<%- key %>", "<%- value[key] %>");
<%							});
-%>
		<%- mapname %>.put("<%- property %>", <%- dictname %>);
<%						} else {
-%>
		<%- mapname %>.put("<%- property %>", "<%- value %>");
<%						}
					});
				});
			});
-%>
		<%- varname %>.put("<%- pathname %>", <%- hashmap %>);

<%		}
	});
}

render(classes, 'classesMap');
render(ids, 'idsMap');
renderDensity(classesDensity, 'classesDensityMap');
renderDensity(idsDensity, 'idsDensityMap');
-%>
	}
}