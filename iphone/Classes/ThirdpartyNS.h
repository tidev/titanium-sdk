/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef Titanium_ThirdpartyNS_h
#define Titanium_ThirdpartyNS_h

#ifndef __TI_NAMESPACE_PREFIX_
#define __TI_NAMESPACE_PREFIX_	TI
#endif

#ifndef __TI_NS_SYMBOL
// Must have multiple levels of macros so that __TI_NAMESPACE_PREFIX_ is
// properly replaced by the time the namespace prefix is concatenated.
#define __TI_NS_REWRITE(ns, symbol) ns ## _ ## symbol
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

// MGSplitView
#ifndef MGSplitViewController
#define MGSplitViewController __TI_NS_SYMBOL(MGSplitViewController)
#endif
#ifndef MGSplitCornersView
#define MGSplitCornersView __TI_NS_SYMBOL(MGSplitCornersView)
#endif
#ifndef MGSplitDividerView
#define MGSplitDividerView __TI_NS_SYMBOL(MGSplitDividerView)
#endif
#ifndef MGSplitViewControllerDelegate
#define MGSplitViewControllerDelegate __TI_NS_SYMBOL(MGSplitViewControllerDelegate)
#endif
#ifndef MGSplitView
#define MGSplitView __TI_NS_SYMBOL(MGSplitView)
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

// ASINetworkQueue
#ifndef ASINetworkQueue
#define ASINetworkQueue __TI_NS_SYMBOL(ASINetworkQueue)
#endif

// ASIInputStream
#ifndef ASIInputStream
#define ASIInputStream __TI_NS_SYMBOL(ASIInputStream)
#endif

// ASIHTTPRequest
#ifndef ASIHTTPRequest
#define ASIHTTPRequest __TI_NS_SYMBOL(ASIHTTPRequest)
#endif
#ifndef ASIHTTPRequestVersion
#define ASIHTTPRequestVersion __TI_NS_SYMBOL(ASIHTTPRequestVersion)
#endif
#ifndef NetworkRequestErrorDomain
#define NetworkRequestErrorDomain __TI_NS_SYMBOL(NetworkRequestErrorDomain)
#endif
#ifndef ASIWWANBandwidthThrottleAmount
#define ASIWWANBandwidthThrottleAmount __TI_NS_SYMBOL(ASIWWANBandwidthThrottleAmount)
#endif

// ASIFormDataRequest
#ifndef ASIFormDataRequest
#define ASIFormDataRequest __TI_NS_SYMBOL(ASIFormDataRequest)
#endif

// ASIAuthenticationDialog
#ifndef ASIAutorotatingViewController
#define ASIAutorotatingViewController __TI_NS_SYMBOL(ASIAutorotatingViewController)
#endif
#ifndef ASIAuthenticationDialog
#define ASIAuthenticationDialog __TI_NS_SYMBOL(ASIAuthenticationDialog)
#endif

// ASIProgressDelegate
#ifndef ASIProgressDelegate
#define ASIProgressDelegate __TI_NS_SYMBOL(ASIProgressDelegate)
#endif

// ASIHTTPRequestDelegate
#ifndef ASIHTTPRequestDelegate
#define ASIHTTPRequestDelegate __TI_NS_SYMBOL(ASIHTTPRequestDelegate)
#endif

// ASIDownloadCache
#ifndef ASIDownloadCache
#define ASIDownloadCache __TI_NS_SYMBOL(ASIDownloadCache)
#endif

// ASICacheDelegate
#ifndef ASICacheDelegate
#define ASICacheDelegate __TI_NS_SYMBOL(ASICacheDelegate)
#endif

// ASIDataDecompressor
#ifndef ASIDataDecompressor
#define ASIDataDecompressor __TI_NS_SYMBOL(ASIDataDecompressor)
#endif

// ASIDataCompressor
#ifndef ASIDataCompressor
#define ASIDataCompressor __TI_NS_SYMBOL(ASIDataCompressor)
#endif

// AudioStreamerCUR
#ifndef AudioStreamerCUR
#define AudioStreamerCUR __TI_NS_SYMBOL(AudioStreamerCUR)
#endif

// AudioStreamer
#ifndef ASStatusChangedNotification
#define ASStatusChangedNotification __TI_NS_SYMBOL(ASStatusChangedNotification)
#endif
#ifndef AudioStreamerDelegate
#define AudioStreamerDelegate __TI_NS_SYMBOL(AudioStreamerDelegate)
#endif
#ifndef AudioStreamerProtocol
#define AudioStreamerProtocol __TI_NS_SYMBOL(AudioStreamerProtocol)
#endif
#ifndef AudioStreamer
#define AudioStreamer __TI_NS_SYMBOL(AudioStreamer)
#endif

// AQRecorder
#ifndef AQRecorder
#define AQRecorder __TI_NS_SYMBOL(AQRecorder)
#endif

// SCListener
#ifndef SCListener
#define SCListener __TI_NS_SYMBOL(SCListener)
#endif

// CAStreamBasicDescription
#ifndef CAStreamBasicDescription
#define CAStreamBasicDescription __TI_NS_SYMBOL(CAStreamBasicDescription)
#endif

// CAXException
#ifndef CAX4CCString
#define CAX4CCString __TI_NS_SYMBOL(CAX4CCString)
#endif
#ifndef CAXException
#define CAXException __TI_NS_SYMBOL(CAXException)
#endif

// Base64Transcoder
#ifndef EstimateBas64EncodedDataSize
#define EstimateBas64EncodedDataSize __TI_NS_SYMBOL(EstimateBas64EncodedDataSize)
#endif
#ifndef EstimateBas64DecodedDataSize
// libtiverify dependency
//#define EstimateBas64DecodedDataSize __TI_NS_SYMBOL(EstimateBas64DecodedDataSize)
#endif
#ifndef Base64EncodeData
#define Base64EncodeData __TI_NS_SYMBOL(Base64EncodeData)
#endif
#ifndef Base64DecodeData
// libtiverify dependency
//#define Base64DecodeData __TI_NS_SYMBOL(Base64DecodeData)
#endif

// SBJSON
#ifndef SBJSONErrorDomain
#define SBJSONErrorDomain __TI_NS_SYMBOL(SBJSONErrorDomain)
#endif
#ifndef SBJSON
#define SBJSON __TI_NS_SYMBOL(SBJSON)
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
