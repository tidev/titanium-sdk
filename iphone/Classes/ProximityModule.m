#import "ProximityModule.h"

@implementation ProximityModule

-(id)available {
  BOOL enabled = [[UIDevice currentDevice] isProximityMonitoringEnabled];
  
  [[UIDevice currentDevice] setProximityMonitoringEnabled:YES];
  BOOL available = [[UIDevice currentDevice] isProximityMonitoringEnabled];
  
  if(!enabled)
    [[UIDevice currentDevice] setProximityMonitoringEnabled:NO];
  
  return NUMBOOL(available);
}

-(void)_listenerAdded:(NSString *)type count:(int)count
{
  if (count == 1 && [type isEqualToString:@"change"])
  {
    [[UIDevice currentDevice] setProximityMonitoringEnabled:YES];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(sensorStateChange:) 
                                                 name:@"UIDeviceProximityStateDidChangeNotification" object:nil];
  }
}

-(void)_listenerRemoved:(NSString *)type count:(int)count
{
  if (count == 0 && [type isEqualToString:@"change"])
  {
    [[UIDevice currentDevice] setProximityMonitoringEnabled:NO];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:@"UIDeviceProximityStateDidChangeNotification" object:nil];
  }
}

#pragma mark Proximity Events
-(void)sensorStateChange:(NSNotificationCenter *)notification
{
  NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                          NUMBOOL([[UIDevice currentDevice] proximityState]), @"close",
                          nil];

  [self fireEvent:@"change" withObject:event];
}

@end
