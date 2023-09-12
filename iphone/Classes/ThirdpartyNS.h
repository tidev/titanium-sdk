/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef Titanium_ThirdpartyNS_h
#define Titanium_ThirdpartyNS_h

#ifndef __TI_NAMESPACE_PREFIX_
#define __TI_NAMESPACE_PREFIX_ TI
#endif

#ifndef __TI_NS_SYMBOL
// Must have multiple levels of macros so that __TI_NAMESPACE_PREFIX_ is
// properly replaced by the time the namespace prefix is concatenated.
#define __TI_NS_REWRITE(ns, symbol) ns##_##symbol
#define __TI_NS_BRIDGE(ns, symbol) __TI_NS_REWRITE(ns, symbol)
#define __TI_NS_SYMBOL(symbol) __TI_NS_BRIDGE(__TI_NAMESPACE_PREFIX_, symbol)
#endif

// AsyncSocket
#ifndef AsyncSocket
#define AsyncSocket __TI_NS_SYMBOL(AsyncSocket)
#endif
#ifndef AsyncReadPacket
#define AsyncReadPacket __TI_NS_SYMBOL(AsyncReadPacket)
#endif
#ifndef AsyncWritePacket
#define AsyncWritePacket __TI_NS_SYMBOL(AsyncWritePacket)
#endif
#ifndef AsyncSocketException
#define AsyncSocketException __TI_NS_SYMBOL(AsyncSocketException)
#endif
#ifndef AsyncSocketErrorDomain
#define AsyncSocketErrorDomain __TI_NS_SYMBOL(AsyncSocketErrorDomain)
#endif
#ifndef AsyncSocketDelegate
#define AsyncSocketDelegate __TI_NS_SYMBOL(AsyncSocketDelegate)
#endif
#ifndef AsyncSpecialPacket
#define AsyncSpecialPacket __TI_NS_SYMBOL(AsyncSpecialPacket)
#endif

// AsyncUdpSocket
#ifndef AsyncSendPacket
#define AsyncSendPacket __TI_NS_SYMBOL(AsyncSendPacket)
#endif
#ifndef AsyncReceivePacket
#define AsyncReceivePacket __TI_NS_SYMBOL(AsyncReceivePacket)
#endif
#ifndef AsyncUdpSocketException
#define AsyncUdpSocketException __TI_NS_SYMBOL(AsyncUdpSocketException)
#endif
#ifndef AsyncUdpSocketErrorDomain
#define AsyncUdpSocketErrorDomain __TI_NS_SYMBOL(AsyncUdpSocketErrorDomain)
#endif
#ifndef AsyncUdpSocket
#define AsyncUdpSocket __TI_NS_SYMBOL(AsyncUdpSocket)
#endif
#ifndef AsyncUdpSocketDelegate
#define AsyncUdpSocketDelegate __TI_NS_SYMBOL(AsyncUdpSocketDelegate)
#endif

// Reachalility
#ifndef kInternetConnection
#define kInternetConnection __TI_NS_SYMBOL(kInternetConnection)
#endif
#ifndef kLocalWiFiConnection
#define kLocalWiFiConnection __TI_NS_SYMBOL(kLocalWiFiConnection)
#endif
#ifndef kReachabilityChangedNotification
#define kReachabilityChangedNotification __TI_NS_SYMBOL(kReachabilityChangedNotification)
#endif
#ifndef Reachability
#define Reachability __TI_NS_SYMBOL(Reachability)
#endif

// PlausibleDatabase
#ifndef PlausibleDatabase
#define PlausibleDatabase __TI_NS_SYMBOL(PlausibleDatabase)
#endif
#ifndef PLDatabaseException
#define PLDatabaseException __TI_NS_SYMBOL(PLDatabaseException)
#endif
#ifndef PLDatabaseErrorDomain
#define PLDatabaseErrorDomain __TI_NS_SYMBOL(PLDatabaseErrorDomain)
#endif
#ifndef PLDatabaseErrorQueryStringKey
#define PLDatabaseErrorQueryStringKey __TI_NS_SYMBOL(PLDatabaseErrorQueryStringKey)
#endif
#ifndef PLDatabaseErrorVendorErrorKey
#define PLDatabaseErrorVendorErrorKey __TI_NS_SYMBOL(PLDatabaseErrorVendorErrorKey)
#endif
#ifndef PLDatabaseErrorVendorStringKey
#define PLDatabaseErrorVendorStringKey __TI_NS_SYMBOL(PLDatabaseErrorVendorStringKey)
#endif
#ifndef PLDatabase
#define PLDatabase __TI_NS_SYMBOL(PLDatabase)
#endif
#ifndef PLPreparedStatement
#define PLPreparedStatement __TI_NS_SYMBOL(PLPreparedStatement)
#endif
#ifndef PLResultSet
#define PLResultSet __TI_NS_SYMBOL(PLResultSet)
#endif
#ifndef PLSqliteException
#define PLSqliteException __TI_NS_SYMBOL(PLSqliteException)
#endif
#ifndef PLSqliteDatabase
#define PLSqliteDatabase __TI_NS_SYMBOL(PLSqliteDatabase)
#endif
#ifndef PLSqlitePreparedStatement
#define PLSqlitePreparedStatement __TI_NS_SYMBOL(PLSqlitePreparedStatement)
#endif
#ifndef PLSqliteResultSet
#define PLSqliteResultSet __TI_NS_SYMBOL(PLSqliteResultSet)
#endif
#ifndef PLSqliteParameterStrategy
#define PLSqliteParameterStrategy __TI_NS_SYMBOL(PLSqliteParameterStrategy)
#endif
#ifndef PLSqliteArrayParameterStrategy
#define PLSqliteArrayParameterStrategy __TI_NS_SYMBOL(PLSqliteArrayParameterStrategy)
#endif
#ifndef PLSqliteDictionaryParameterStrategy
#define PLSqliteDictionaryParameterStrategy __TI_NS_SYMBOL(PLSqliteDictionaryParameterStrategy)
#endif

#endif
