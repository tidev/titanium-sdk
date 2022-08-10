// Alias NodeJS.Global definition to make zone.js typings happy
// including @types/node clashes with @types/titanium
declare namespace NodeJS {
  type Global = Titanium.Global
}
