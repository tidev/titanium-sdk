/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_PLATFORM

#import "PlatformModule.h"
#import "TiPlatformDisplayCaps.h"
#import "TiUtils+Addons.h"
#import <TitaniumKit/TiApp.h>

#import <mach/mach.h>
#import <sys/sysctl.h>
#import <sys/utsname.h>

#import <arpa/inet.h>
#import <ifaddrs.h>
#import <sys/socket.h>
#import <sys/types.h>

#if defined(USE_TI_PLATFORMIDENTIFIERFORADVERTISING) || defined(USE_TI_PLATFORMGETIDENTIFIERFORADVERTISING)
@import AdSupport;
#endif

NSString *const WIFI_IFACE = @"en0";
NSString *const DATA_IFACE = @"pdp_ip0";

@implementation PlatformModule

@synthesize architecture, availableMemory, model, name, osname, ostype, processorCount, totalMemory, uptime, username, version;

#pragma mark Internal

- (id)init
{
  if (self = [super init]) {
    UIDevice *theDevice = [UIDevice currentDevice];
    name = [[theDevice systemName] retain];
    version = [[theDevice systemVersion] retain];

    // grab logical CPUs
    int cores = 1;
    size_t sizeof_cores = sizeof(cores);
    sysctlbyname("hw.logicalcpu_max", &cores, &sizeof_cores, NULL, 0);
    if (cores <= 0) {
      cores = 1;
    }
    processorCount = [[NSNumber numberWithInt:cores] retain];

    username = [[theDevice name] retain];
#ifdef __LP64__
    ostype = [@"64bit" retain];
#else
    ostype = [@"32bit" retain];
#endif

    if ([TiUtils isIPad]) {
      // ipad is a constant for Ti.Platform.osname
      osname = [@"ipad" retain];
    } else {
      // iphone is a constant for Ti.Platform.osname
      osname = [@"iphone" retain];
    }

    NSString *themodel = [theDevice model];

    // attempt to determine extended phone info
    struct utsname u;
    uname(&u);

    // detect simulator
    if (strcmp(u.machine, "i386") == 0 || strcmp(u.machine, "x86_64") == 0) {
      model = [[NSString stringWithFormat:@"%s (Simulator)", getenv("SIMULATOR_MODEL_IDENTIFIER")] retain];
    } else {
      model = [[NSString alloc] initWithUTF8String:u.machine];
    }
    architecture = [[TiUtils currentArchitecture] retain];

    // needed for platform displayCaps orientation to be correct
    [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(name);
  RELEASE_TO_NIL(model);
  RELEASE_TO_NIL(version);
  RELEASE_TO_NIL(architecture);
  RELEASE_TO_NIL(processorCount);
  RELEASE_TO_NIL(username);
  RELEASE_TO_NIL(ostype);
  RELEASE_TO_NIL(availableMemory);
  RELEASE_TO_NIL(totalMemory);
  RELEASE_TO_NIL(uptime);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.Platform";
}

- (void)registerListeners:(id)unused
{
  UIDevice *device = [UIDevice currentDevice];
  // set a flag to temporarily turn on battery enablement
  if (!batteryEnabled && !device.batteryMonitoringEnabled) {
    batteryEnabled = YES;
    [device setBatteryMonitoringEnabled:YES];
  }

  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(batteryStateChanged:) name:UIDeviceBatteryStateDidChangeNotification object:device];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(batteryStateChanged:) name:UIDeviceBatteryLevelDidChangeNotification object:device];
}

- (void)unregisterListeners:(id)unused
{
  UIDevice *device = [UIDevice currentDevice];
  if (batteryEnabled) {
    [device setBatteryMonitoringEnabled:NO];
    batteryEnabled = NO;
  }
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceBatteryStateDidChangeNotification object:device];
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceBatteryLevelDidChangeNotification object:device];
}

- (void)_listenerAdded:(NSString *)type count:(int)count
{
  if (count == 1 && [type isEqualToString:@"battery"]) {
    TiThreadPerformOnMainThread(
        ^{
          [self registerListeners:nil];
        },
        YES);
  }
}

- (void)_listenerRemoved:(NSString *)type count:(int)count
{
  if (count == 0 && [type isEqualToString:@"battery"]) {
    TiThreadPerformOnMainThread(
        ^{
          [self unregisterListeners:nil];
        },
        YES);
  }
}

- (NSString *)getIface:(NSString *)iname mask:(BOOL)mask
{
  struct ifaddrs *head = NULL;
  struct ifaddrs *ifaddr = NULL;
  getifaddrs(&head);

  NSString *str = nil;
  for (ifaddr = head; ifaddr != NULL; ifaddr = ifaddr->ifa_next) {
    if (ifaddr->ifa_addr->sa_family == AF_INET && !strcmp(ifaddr->ifa_name, [iname UTF8String])) {

      char ipaddr[20];
      struct sockaddr_in *addr;
      if (mask) {
        addr = (struct sockaddr_in *)ifaddr->ifa_netmask;
      } else {
        addr = (struct sockaddr_in *)ifaddr->ifa_addr;
      }
      inet_ntop(addr->sin_family, &(addr->sin_addr), ipaddr, 20);
      str = [NSString stringWithUTF8String:ipaddr];
      break;
    }
  }

  freeifaddrs(head);
  return str;
}

#pragma mark Public APIs

- (NSString *)runtime
{
  return @"javascriptcore";
}
GETTER_IMPL(NSString *, runtime, Runtime);

- (NSString *)manufacturer
{
  return @"apple";
}
GETTER_IMPL(NSString *, manufacturer, Manufacturer);

- (NSString *)locale
{
  // this will return the locale that the user has set the phone in
  // not the region where the phone is
  NSUserDefaults *defs = [NSUserDefaults standardUserDefaults];
  NSArray *languages = [defs objectForKey:@"AppleLanguages"];
  return [languages count] > 0 ? [languages objectAtIndex:0] : @"en";
}
GETTER_IMPL(NSString *, locale, Locale);

- (NSString *)macaddress
{
  return [TiUtils appIdentifier];
}
GETTER_IMPL(NSString *, macaddress, Macaddress);

- (NSNumber *)uptime
{
  return [NSNumber numberWithDouble:[[NSProcessInfo processInfo] systemUptime]];
}

- (NSString *)identifierForVendor
{
  return [[[UIDevice currentDevice] identifierForVendor] UUIDString];
}
GETTER_IMPL(NSString *, identifierForVendor, IdentifierForVendor);

#if defined(USE_TI_PLATFORMIDENTIFIERFORADVERTISING) || defined(USE_TI_PLATFORMGETIDENTIFIERFORADVERTISING)
- (BOOL)isAdvertisingTrackingEnabled
{
  return [[ASIdentifierManager sharedManager] isAdvertisingTrackingEnabled];
}

- (NSString *)identifierForAdvertising
{
  return [[[ASIdentifierManager sharedManager] advertisingIdentifier] UUIDString];
}
#else
- (BOOL)isAdvertisingTrackingEnabled
{
  return NO;
}

- (NSString *)identifierForAdvertising
{
  return @"";
}
#endif

GETTER_IMPL(BOOL, isAdvertisingTrackingEnabled, IsAdvertisingTrackingEnabled);
GETTER_IMPL(NSString *, identifierForAdvertising, IdentifierForAdvertising);

- (NSString *)id
{
  return [TiUtils appIdentifier];
}
GETTER_IMPL(NSString *, id, Id);

- (NSString *)createUUID
{
  return [TiUtils createUUID];
}

- (BOOL)is24HourTimeFormat
{
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  [dateFormatter setLocale:[NSLocale currentLocale]];
  [dateFormatter setTimeStyle:NSDateFormatterShortStyle];
  NSString *dateInStringForm = [dateFormatter stringFromDate:[NSDate date]];
  NSRange amRange = [dateInStringForm rangeOfString:[dateFormatter AMSymbol]];
  NSRange pmRange = [dateInStringForm rangeOfString:[dateFormatter PMSymbol]];
  [dateFormatter release];
  return amRange.location == NSNotFound && pmRange.location == NSNotFound;
}

- (NSNumber *)availableMemory
{
  vm_statistics_data_t vmStats;
  mach_msg_type_number_t infoCount = HOST_VM_INFO_COUNT;
  kern_return_t kernReturn = host_statistics(mach_host_self(), HOST_VM_INFO, (host_info_t)&vmStats, &infoCount);

  if (kernReturn != KERN_SUCCESS) {
    return [NSNumber numberWithDouble:-1];
  }

  return [NSNumber numberWithUnsignedLong:(vm_page_size * vmStats.free_count)];
}

- (NSNumber *)totalMemory
{
  vm_statistics_data_t vmStats;
  mach_msg_type_number_t infoCount = HOST_VM_INFO_COUNT;
  kern_return_t kernReturn = host_statistics(mach_host_self(), HOST_VM_INFO, (host_info_t)&vmStats, &infoCount);

  if (kernReturn != KERN_SUCCESS) {
    return [NSNumber numberWithDouble:-1];
  }

  unsigned long mem_used = (vmStats.active_count + vmStats.inactive_count + vmStats.wire_count) * vm_page_size;
  unsigned long mem_free = vmStats.free_count * vm_page_size;
  unsigned long mem_total = mem_used + mem_free;

  return [NSNumber numberWithUnsignedLong:mem_total];
}
GETTER_IMPL(NSNumber *, availableMemory, AvailableMemory);

- (BOOL)openURL:(NSString *)url withOptions:(id)options andCallback:(JSValue *)callback
{
  NSURL *newUrl = [TiUtils toURL:url proxy:self];
  BOOL result = NO;

  // iOS 10+
  NSMutableDictionary *optionsDict = [NSMutableDictionary dictionary];
  if ([options isKindOfClass:[NSDictionary class]]) {
    optionsDict = (NSMutableDictionary *)options;
  } else if ([options isKindOfClass:[JSValue class]]) {
    callback = (JSValue *)options;
  }

  if (newUrl != nil) {
    [[UIApplication sharedApplication] openURL:newUrl
                                       options:optionsDict
                             completionHandler:^(BOOL success) {
                               if (callback != nil) {
                                 [callback callWithArguments:@[ @{@"success" : @(success)} ]];
                               }
                             }];
  }

  return [NSNumber numberWithBool:result];
}

- (BOOL)canOpenURL:(NSString *)arg
{
  NSURL *url = [TiUtils toURL:arg proxy:self];
  return [[UIApplication sharedApplication] canOpenURL:url];
}

- (TiPlatformDisplayCaps *)displayCaps
{
  return [[[TiPlatformDisplayCaps alloc] init] autorelease];
}
GETTER_IMPL(TiPlatformDisplayCaps *, displayCaps, DisplayCaps);
- (TiPlatformDisplayCaps *)DisplayCaps
{
  return [self displayCaps];
}

- (void)setBatteryMonitoring:(BOOL)yn
{
  if (![NSThread isMainThread]) {
    TiThreadPerformOnMainThread(
        ^{
          [self setBatteryMonitoring:yn];
        },
        YES);
  }
  [[UIDevice currentDevice] setBatteryMonitoringEnabled:yn];
}

- (BOOL)batteryMonitoring
{
  if (![NSThread isMainThread]) {
    __block BOOL result = NO;
    TiThreadPerformOnMainThread(
        ^{
          result = [self batteryMonitoring];
        },
        YES);
    return result;
  }
  return [UIDevice currentDevice].batteryMonitoringEnabled;
}
READWRITE_IMPL(BOOL, batteryMonitoring, BatteryMonitoring);

- (NSNumber *)batteryState
{
  if (![NSThread isMainThread]) {
    __block NSNumber *result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self batteryState] retain];
        },
        YES);
    return [result autorelease];
  }
  return NUMINT([[UIDevice currentDevice] batteryState]);
}
GETTER_IMPL(NSNumber *, batteryState, BatteryState);

- (NSNumber *)batteryLevel
{
  if (![NSThread isMainThread]) {
    __block NSNumber *result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self batteryLevel] retain];
        },
        YES);
    return [result autorelease];
  }
  return NUMFLOAT([[UIDevice currentDevice] batteryLevel]);
}
GETTER_IMPL(NSNumber *, batteryLevel, BatteryLevel);

- (NSString *)address
{
#if TARGET_IPHONE_SIMULATOR
  // Assume classical ethernet and wifi interfaces
  NSArray *interfaces = [NSArray arrayWithObjects:@"en0", @"en1", nil];
  for (NSString *interface in interfaces) {
    NSString *iface = [self getIface:interface mask:NO];
    if (iface) {
      return iface;
    }
  }
  return nil;
#else
  return [self getIface:WIFI_IFACE mask:NO];
#endif
}
GETTER_IMPL(NSString *, address, Address);

- (NSString *)dataAddress
{
#if TARGET_IPHONE_SIMULATOR
  return nil; // Handy shortcut
#else
  return [self getIface:DATA_IFACE mask:NO];
#endif
}
GETTER_IMPL(NSString *, dataAddress, DataAddress);

// Only available for the local wifi; why would you want it for the data network?
- (NSString *)netmask
{
#if TARGET_IPHONE_SIMULATOR
  // Assume classical ethernet and wifi interfaces
  NSArray *interfaces = [NSArray arrayWithObjects:@"en0", @"en1", nil];
  for (NSString *interface in interfaces) {
    NSString *iface = [self getIface:interface mask:YES];
    if (iface) {
      return iface;
    }
  }
  return nil;
#else
  return [self getIface:WIFI_IFACE mask:YES];
#endif
}
GETTER_IMPL(NSString *, netmask, Netmask);

// accessors for synthesized properties
GETTER_IMPL(NSString *, architecture, Architecture);
GETTER_IMPL(NSString *, model, Model);
GETTER_IMPL(NSString *, name, Name);
GETTER_IMPL(NSString *, osname, Osname);
GETTER_IMPL(NSString *, ostype, Ostype);
GETTER_IMPL(NSNumber *, processorCount, ProcessorCount);
GETTER_IMPL(NSNumber *, totalMemory, TotalMemory);
GETTER_IMPL(NSNumber *, uptime, Uptime);
GETTER_IMPL(NSString *, username, Username);
GETTER_IMPL(NSString *, version, Version);

MAKE_SYSTEM_PROP(BATTERY_STATE_UNKNOWN, UIDeviceBatteryStateUnknown);
MAKE_SYSTEM_PROP(BATTERY_STATE_UNPLUGGED, UIDeviceBatteryStateUnplugged);
MAKE_SYSTEM_PROP(BATTERY_STATE_CHARGING, UIDeviceBatteryStateCharging);
MAKE_SYSTEM_PROP(BATTERY_STATE_FULL, UIDeviceBatteryStateFull);

#pragma mark Delegates

- (void)batteryStateChanged:(NSNotification *)note
{
  NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[self batteryState], @"state", [self batteryLevel], @"level", nil];
  [self fireEvent:@"battery" withDict:event];
}

@end

#endif
