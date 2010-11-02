/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

/* You would expect these macros to be used in the header files, but because they can generate checking code, they should be in the .m files instead.*/

/* This declares that the class is publically viewable, and that should be considered a subclass of the closest superclass that also marked with a TI_PUBLIC_CLASS */
/* To speed lookup, this will produce a method on the module to generate an instance.*/
#define TI_PUBLIC_CLASS(moduleName,className)	\
@class moduleName##Module;	\
@interface moduleName##Module (className##_generation)	\
-(id)create##className:(id)args;	\
@end	\
@implementation	moduleName##Module (className##_generation)	\
-(TiProxy *)create##className:(id)args	\
{	\
	TiProxy * result = [[Ti##moduleName##className##Proxy alloc] _initWithPageContext:[self pageContext] args:args];	\
	return [result autorelease];	\
}	\
@end

#ifdef DEBUG

#define TI_PUBLIC_METHOD(methodName,returnType)	\
-(returnType) methodName: (id)args	\
{	\
	int argCount = [args count];

#define TI_PUBLIC_METHOD_ARG_OBJECT(argPosition,argName,argType,argOptional,argCheck)	\
	argType *argName = nil;														\
	if (argCount < argPosition) {												\
		argType *argName = [(NSArray *)args objectAtIndex:argPosition];			\
		if(![argName isKindOfClass:[argType class]])							\
		{																		\
			[self throwException:TiExceptionInvalidType subreason:				\
					[NSString stringWithFormat:@"argument #%d (%s) needs to be of type %s, but was %@ instead.",	\
					argPosition,#argName,#argType,[argName class]] location:CODELOCATION]; \
		}																		\
		argCheck;																\
	}																			\
	else if (!argOptional)														\
	{																			\
		[self throwException:TiExceptionNotEnoughArguments						\
				subreason: [NSString stringWithFormat:@"argument #%d (%s) was missing and is not optional",argPosition,#argName]	\
				location:CODELOCATION]; \
	}

#define TI_PUBLIC_METHOD_END_ARGS(methodName,returnType)	\
	if(![@"void" isEqualToString:@"" #returnType])	\
	{	\
		return [self methodName##_CONTINUE:args];	\
	}	\
}	\
-(returnType) methodName##_CONTINUE: (id)args

#else

#define TI_PUBLIC_METHOD(methodName,returnType)	\
//No-op

#define TI_PUBLIC_METHOD_ARG_OBJECT(argPosition,argName,argType,argOptional,argCheck)	\
//No-op

#define TI_PUBLIC_METHOD_END_ARGS(methodName,returnType)	\
-(returnType) methodName: (id)args


#endif //Debug