/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_APPIOSSEARCHQUERY) || defined(USE_TI_APPIOSSEARCHABLEITEMATTRIBUTESET)
#import "TiAppiOSSearchableItemAttributeSetProxy.h"
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiUtils.h>

@implementation TiAppiOSSearchableItemAttributeSetProxy

- (NSString *)apiName
{
  return @"Ti.App.iOS.SearchableItemAttributeSet";
}

- (void)dealloc
{
  RELEASE_TO_NIL(_attributes);
  [super dealloc];
}

- (void)initFieldTypeInformation
{
  dateFieldTypes = @[ @"metadataModificationDate", @"recordingDate", @"downloadedDate", @"lastUsedDate", @"contentCreationDate", @"contentModificationDate", @"addedDate", @"recordingDate", @"downloadedDate", @"lastUsedDate" ];
  urlFieldTypes = @[ @"contentURL", @"thumbnailURL", @"url" ];
  unsupportedFieldTypes = @[ @"thumbnailData" ];
}

- (id)initWithItemContentType:(NSString *)itemContentType withProps:(NSDictionary *)props
{
  if (self = [super init]) {
    _attributes = [[CSSearchableItemAttributeSet alloc] initWithItemContentType:itemContentType];
    [self initFieldTypeInformation];
    if (props != nil) {
      [self applyLoadTimeProperties:props];
    }
  }
  return self;
}

- (id)initWithItemAttributeSet:(CSSearchableItemAttributeSet *)attributeSet
{
  if (self = [super init]) {
    _attributes = [attributeSet retain];
  }
  return self;
}

- (void)applyLoadTimeProperties:(NSDictionary *)props
{
  [props enumerateKeysAndObjectsUsingBlock:^(id key, id object, BOOL *stop) {
    if ([_attributes respondsToSelector:NSSelectorFromString(key)]) {
      //Check this is a supported type
      if (![unsupportedFieldTypes containsObject:key]) {
        if ([dateFieldTypes containsObject:key]) {
          //Use date logic to add
          [_attributes setValue:[TiUtils dateForUTCDate:object] forKey:key];
        } else if ([urlFieldTypes containsObject:key]) {
          //Use URL logic to add
          [_attributes setValue:[self sanitizeURL:object] forKey:key];
        } else {
          [_attributes setValue:object forKey:key];
        }
      } else {
        //Use blob to add
        [_attributes setValue:[object data] forKey:key];
      }
    } else {
      NSLog(@"[ERROR] The property \"%@\" is invalid. Please check the property-name and iOS-compatibility.", key);
    }
  }];
}

//*********************************
//  CSGeneral Section
//*********************************

//A localized string to be displayed in the UI for this item.
- (NSString *)displayName
{
  return _attributes.displayName;
}

- (void)setDisplayName:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setDisplayName, value);
  _attributes.displayName = value;
}

//An array of localized strings of alternate display names for this item.
- (NSArray *)alternateNames
{
  return _attributes.alternateNames;
}

- (void)setAlternateNames:(NSArray *)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setAlternateNames, value);
  _attributes.alternateNames = value;
}

//This is the complete path to the item.
- (NSString *)path
{
  return _attributes.path;
}

- (void)setPath:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setPath, value);
  _attributes.path = value;
}

//Optional file URL representing the content to be indexed
- (NSString *)contentURL
{
  return [_attributes.contentURL absoluteString];
}

- (void)setContentURL:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setContentURL, value);
  _attributes.contentURL = [self sanitizeURL:value];
}

//Optional file URL pointing to a thumbnail image for this item
- (NSString *)thumbnailURL
{
  return [_attributes.thumbnailURL absoluteString];
}

- (void)setThumbnailURL:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setThumbnailURL, value);
  _attributes.thumbnailURL = [self sanitizeURL:value];
}

//Optional image data for thumbnail for this item
- (TiBlob *)thumbnailData
{
  return [[[TiBlob alloc] initWithData:_attributes.thumbnailData mimetype:_attributes.contentType] autorelease];
}

- (void)setThumbnailData:(id)value
{
  ENSURE_SINGLE_ARG(value, TiBlob);
  ENSURE_UI_THREAD(setThumbnailData, value);
  _attributes.thumbnailData = [value data];
}

//For activities, this is the unique identifier for the item this activity is related to
- (NSString *)relatedUniqueIdentifier
{
  return _attributes.relatedUniqueIdentifier;
}

- (void)setRelatedUniqueIdentifier:(id)identifier
{
  ENSURE_SINGLE_ARG(identifier, NSString);
  ENSURE_UI_THREAD(setRelatedUniqueIdentifier, identifier);
  _attributes.relatedUniqueIdentifier = identifier;
}

//This is the date that the last metadata attribute was changed.
- (NSString *)metadataModificationDate
{
  if (_attributes.metadataModificationDate == nil) {
    return nil;
  }

  return [TiUtils UTCDateForDate:_attributes.metadataModificationDate];
}

- (void)setMetadataModificationDate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setMetadataModificationDate, value);
  _attributes.metadataModificationDate = [TiUtils dateForUTCDate:value];
}

//UTI Type pedigree for an item.  Common types can be found in UTCoreTypes.h
- (NSString *)contentType
{
  return _attributes.contentType;
}

- (NSArray *)contentTypeTree
{
  return _attributes.contentTypeTree;
}

- (void)setContentTypeTree:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setContentTypeTree, value);
  _attributes.contentTypeTree = value;
}

//Represents keywords associated with this particular item.
//Example Keywords might be Birthday,Important etc.
- (NSArray *)keywords
{
  return _attributes.keywords;
}

- (void)setKeywords:(id)words
{
  ENSURE_ARRAY(words)
  ENSURE_UI_THREAD(setKeywords, words);
  _attributes.keywords = words;
}

//The title of this particular item.
//Title of the document, or it could be the title of this mp3 or a subject of a mail message.
- (NSString *)title
{
  return _attributes.title;
}

- (void)setTitle:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setTitle, value);
  _attributes.title = value;
}

//*********************************
//  CSDocuments Section
//*********************************

//Subject of the this item.
- (NSString *)subject
{
  return _attributes.subject;
}

- (void)setSubject:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setSubject, value);
  _attributes.subject = value;
}

//Theme of the this item.
- (NSString *)theme
{
  return _attributes.theme;
}

- (void)setTheme:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setTheme, value);
  _attributes.theme = value;
}

//An account of the content of the resource. Description may include
//but is not limited to: an abstract, table of contents, reference
//to a graphical representation of content or a free-text account of
//the content.
- (NSString *)contentDescription
{
  return _attributes.contentDescription;
}

- (void)setContentDescription:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setContentDescription, value);
  _attributes.contentDescription = value;
}

//Used  to reference to the resource within a given
//context. Recommended best practice is to identify the resource by
//means of a string or number conforming to a formal identification system.
- (NSString *)identifier
{
  return _attributes.identifier;
}

- (void)setIdentifier:(id)identifier
{
  ENSURE_SINGLE_ARG(identifier, NSString);
  ENSURE_UI_THREAD(setIdentifier, identifier);
  _attributes.identifier = identifier;
}

//A class of entity for whom the resource is intended or useful. A
//class of entity may be determined by the creator or the publisher
//or by a third party.
- (NSArray *)audiences
{
  return _attributes.audiences;
}

- (void)setAudiences:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setAudiences, value);
  _attributes.audiences = value;
}

//Size of the document in MB.
- (NSNumber *)fileSize
{
  return _attributes.fileSize;
}

- (void)setFileSize:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setFileSize, value);
  _attributes.fileSize = value;
}

//Number of pages in the item.
- (NSNumber *)pageCount
{
  return _attributes.pageCount;
}

- (void)setPageCount:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setPageCount, value);
  _attributes.pageCount = value;
}

//Width in points (72 points per inch) of the document page
//(first page only for PDF's - other pages within the PDF may
//not be the same width).
- (NSNumber *)pageWidth
{
  return _attributes.pageWidth;
}

- (void)setPageWidth:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setPageWidth, value);
  _attributes.pageWidth = value;
}

//Height in points (72 points per inch) of the document page
//(first page only for PDF's - other pages within the PDF may
//not be the same height).
- (NSNumber *)pageHeight
{
  return _attributes.pageHeight;
}

- (void)setPageHeight:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setPageHeight, value);
  _attributes.pageHeight = value;
}

//Security (encryption) method used in the file
- (NSString *)securityMethod
{
  return _attributes.securityMethod;
}

- (void)setSecurityMethod:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setSecurityMethod, value);
  _attributes.securityMethod = value;
}

//Application used to create the document content (e.g. "Word","Framemaker", etc.).
- (NSString *)creator
{
  return _attributes.creator;
}

- (void)setCreator:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setCreator, value);
  _attributes.creator = value;
}

//Software used to convert the original content into a PDF stream
//(e.g. "Distiller", etc.).
- (NSArray *)encodingApplications
{
  return _attributes.encodingApplications;
}

- (void)setEncodingApplications:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setEncodingApplications, value);
  _attributes.encodingApplications = value;
}

//Kind that this item represents.
- (NSString *)kind
{
  return _attributes.kind;
}

- (void)setKind:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setKind, value);
  _attributes.kind = value;
}

//Array of font names used in the item.
- (NSArray *)fontNames
{
  return _attributes.fontNames;
}

- (void)setFontNames:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setFontNames, value);
  _attributes.fontNames = value;
}

//*********************************
//  CSMusic Section
//*********************************

//The sample rate of the audio data contained in the file. The sample rate is a
//float value representing hz (audio_frames/second). For example: 44100.0, 22254.54.
- (NSNumber *)audioSampleRate
{
  return _attributes.audioSampleRate;
  ;
}

- (void)setAudioSampleRate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setAudioSampleRate, value);
  _attributes.audioSampleRate = value;
}

//The number of channels in the audio data contained in the file. This item only represents
//the number of discreet channels of audio data found in the file. It does not indicate
//any configuration of the data in regards to a user's speaker setup.
- (NSNumber *)audioChannelCount
{
  return _attributes.audioChannelCount;
}

- (void)setAudioChannelCount:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setAudioChannelCount, value);
  _attributes.audioChannelCount = value;
}

//The tempo of the music contained in the audio file in Beats Per Minute.
- (NSNumber *)tempo
{
  return _attributes.tempo;
}

- (void)setTempo:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setTempo, value);
  _attributes.tempo = value;
}

//The musical key of the song/composition contained in an audio file.
//For example: C, Dm, F#m, Bb.
- (NSString *)keySignature
{
  return _attributes.keySignature;
}

- (void)setKeySignature:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setKeySignature, value);
  _attributes.keySignature = value;
}

//The time signature of the musical composition contained in the audio/MIDI file.
//For example: "4/4", "7/8".
- (NSString *)timeSignature
{
  return _attributes.timeSignature;
}

- (void)setTimeSignature:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setTimeSignature, value);
  _attributes.timeSignature = value;
}

//The name of the application that encoded the data contained in the audio file.
- (NSString *)audioEncodingApplication
{
  return _attributes.audioEncodingApplication;
}

- (void)setAudioEncodingApplication:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setAudioEncodingApplication, value);
  _attributes.audioEncodingApplication = value;
}

//The composer of the song/composition contained in the audio file.
- (NSString *)composer
{
  return _attributes.composer;
}

- (void)setComposer:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setComposer, value);
  _attributes.composer = value;
}

//The lyricist/text writer for song/composition contained in the audio file.
- (NSString *)lyricist
{
  return _attributes.lyricist;
}

- (void)setLyricist:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setLyricist, value);
  _attributes.lyricist = value;
}

//The title for a collection of media. This is analagous to a record album,
//or photo album whichs are collections of audio or images.
- (NSString *)album
{
  return _attributes.album;
}

- (void)setAlbum:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setAlbum, value);
  _attributes.album = value;
}

//The artist for the media
- (NSString *)artist
{
  return _attributes.artist;
}

- (void)setArtist:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setArtist, value);
  _attributes.artist = value;
}

//The track number of a song/composition when it is part of an album
- (NSNumber *)audioTrackNumber
{
  return _attributes.audioTrackNumber;
}

- (void)setAudioTrackNumber:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setAudioTrackNumber, value);
  _attributes.audioTrackNumber = value;
}

//The recording date of the song/composition. This information differs from
//the contentCreationDate attribute as it indicates the date that the
//'art' was created, in contrast to contentCreationDate which for example, could indicate
//the creation date of an edited or 'mastered' version of the original art.
- (NSString *)recordingDate
{
  if (_attributes.recordingDate == nil) {
    return nil;
  }
  return [TiUtils UTCDateForDate:_attributes.recordingDate];
}

- (void)setRecordingDate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setRecordingDate, value);
  _attributes.recordingDate = [TiUtils dateForUTCDate:value];
}

//The musical genre of the song/composition contained in the audio file.
//For example: Jazz, Pop, Rock, Classical.
- (NSString *)musicalGenre
{
  return _attributes.musicalGenre;
}

- (void)setMusicalGenre:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setMusicalGenre, value);
  _attributes.musicalGenre = value;
}

//This attribute indicates whether the MIDI sequence contained in the file is setup for use with a General MIDI device.  Should be 1 if true, 0 otherwise.
- (NSNumber *)generalMIDISequence
{
  return _attributes.generalMIDISequence;
}

- (void)setGeneralMIDISequence:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setGeneralMIDISequence, value);
  _attributes.generalMIDISequence = value;
}

//Meta data attribute that stores the category of
//instrument. Files should have an instrument associated with
//them ("Other Instrument" is provided as a catch-all). For some
//categories, like "Keyboards" there are instrument names which
//provide a more detailed instrument definition (e.g., Piano,Organ, etc.)
- (NSString *)musicalInstrumentCategory
{
  return _attributes.musicalInstrumentCategory;
}

- (void)setMusicalInstrumentCategory:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setMusicalInstrumentCategory, value);
  _attributes.musicalInstrumentCategory = value;
}

//Meta data attribute that stores the name of instrument
//(relative to the instrument category) Files can have an
//instrument name associated with them if they have certain
//instrument categories (e.g., the category Percussion has
//                       multiple instruments, including Conga and Bongo).
- (NSString *)musicalInstrumentName
{
  return _attributes.musicalInstrumentName;
}

- (void)setMusicalInstrumentName:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setMusicalInstrumentName, value);
  _attributes.musicalInstrumentName = value;
}

//*********************************
//  CSActionExtras Section
//*********************************

// If supportsPhoneCall is 1 and the item has the phoneNumbers property, then the phone number may be used to initiate phone calls. This should be used to indicate that using the phone number is appropriate, and a primary action for the user. For example, supportsPhoneCall would be set on a business, but not an academic paper that happens to have phone numbers for the authors or the institution.
- (NSNumber *)supportsPhoneCall
{
  return _attributes.supportsPhoneCall;
}

- (void)setSupportsPhoneCall:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setSupportsPhoneCall, value);
  _attributes.supportsPhoneCall = value;
}

// If supportsNavigation is set to 1, and the item has the latitude and longitude properties set, then the latitude and longitude may be used for navigation. For example, supportsNavigation would be set on a restaurant review, but not on a photo.
- (NSNumber *)supportsNavigation
{
  return _attributes.supportsNavigation;
}

- (void)setSupportsNavigation:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setSupportsNavigation, value);
  _attributes.supportsNavigation = value;
}

//*********************************
//  CSContainment Section
//*********************************

- (NSString *)containerTitle
{
  return _attributes.containerTitle;
}

- (void)setContainerTitle:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setContainerTitle, value);
  _attributes.containerTitle = value;
}

- (NSString *)containerDisplayName
{
  return _attributes.containerDisplayName;
}

- (void)setContainerDisplayName:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setContainerDisplayName, value);
  _attributes.containerDisplayName = value;
}

- (NSString *)containerIdentifier
{
  return _attributes.containerIdentifier;
}

- (void)setContainerIdentifier:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setContainerIdentifier, value);
  _attributes.containerIdentifier = value;
}

- (NSNumber *)containerOrder
{
  return _attributes.containerOrder;
}

- (void)setContainerOrder:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setContainerOrder, value);
  _attributes.containerOrder = value;
}

//*********************************
//  CSMedia Section
//*********************************

//The list of editor/editors that have worked on this item.
- (NSArray *)editors
{
  return _attributes.editors;
}

- (void)setEditors:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setEditors, value);
  _attributes.editors = value;
}

//The list of people who are visible in an image or movie or written about in a document.
- (NSArray *)participants
{
  return _attributes.participants;
}

- (void)setParticipants:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setParticipants, value);
  _attributes.participants = value;
}

//The list of projects that this item is part of.
//For example if you were working on a movie, all of the movie files could be marked
//as belonging to the project "My movie"
- (NSArray *)projects
{
  return _attributes.projects;
}

- (void)setProjects:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setProjects, value);
  _attributes.projects = value;
}

// This is the date that the file was last downloaded / received.
// This is the date that the file was last downloaded / received.
- (NSString *)downloadedDate
{
  if (_attributes.downloadedDate == nil) {
    return nil;
  }
  return [TiUtils UTCDateForDate:_attributes.downloadedDate];
}

- (void)setDownloadedDate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setDownloadedDate, value);
  _attributes.downloadedDate = [TiUtils dateForUTCDate:value];
}

//This attribute indicates where the item was obtained from.
//Examples:
//- downloaded file may refer to the site they were downloaded from,the refering URL, etc
//- files received by email may indicate who sent the file, the message subject, etc
- (NSArray *)contentSources
{
  return _attributes.contentSources;
}

- (void)setContentSources:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setContentSources, value);
  _attributes.contentSources = value;
}

//This is a comment related to a file.
- (NSString *)comment
{
  return _attributes.comment;
}

- (void)setComment:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setComment, value);
  _attributes.comment = value;
}

//This is the copyright of the content.
- (NSString *)copyright
{
  return _attributes.copyright;
}

- (void)setCopyright:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setCopyright, value);
  _attributes.copyright = value;
}

//This is the date that the item was last used
- (NSString *)lastUsedDate
{
  if (_attributes.lastUsedDate == nil) {
    return nil;
  }
  return [TiUtils UTCDateForDate:_attributes.lastUsedDate];
}

- (void)setLastUsedDate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setLastUsedDate, value);
  _attributes.lastUsedDate = [TiUtils dateForUTCDate:value];
}

//This is the date that the contents of the item were created
//This is the date that the contents of the item were created
- (NSString *)contentCreationDate
{
  if (_attributes.contentCreationDate == nil) {
    return nil;
  }
  return [TiUtils UTCDateForDate:_attributes.contentCreationDate];
}

- (void)setContentCreationDate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setContentCreationDate, value);
  _attributes.contentCreationDate = [TiUtils dateForUTCDate:value];
}

//This is the date that the contents of the item were last modified
- (NSString *)contentModificationDate
{
  if (_attributes.contentModificationDate == nil) {
    return nil;
  }
  return [TiUtils UTCDateForDate:_attributes.contentModificationDate];
}

- (void)setContentModificationDate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setContentModificationDate, value);
  _attributes.contentModificationDate = [TiUtils dateForUTCDate:value];
}

//This is the date that the item was moved into the current location.
- (NSString *)addedDate
{
  if (_attributes.addedDate == nil) {
    return nil;
  }
  return [TiUtils UTCDateForDate:_attributes.addedDate];
}

- (void)setAddedDate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setAddedDate, value);
  _attributes.addedDate = [TiUtils dateForUTCDate:value];
}

//This is the duration, in seconds, of the content of the item (if appropriate).
- (NSNumber *)duration
{
  return _attributes.duration;
}

- (void)setDuration:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setDuration, value);
  _attributes.duration = value;
}

//A list of contacts that are somehow associated with this document, beyond what is captured as Author.
- (NSArray *)contactKeywords
{
  return _attributes.contactKeywords;
}

- (void)setContactKeywords:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setContactKeywords, value);
  _attributes.contactKeywords = value;
}

//A version specifier for this item.
- (NSString *)version
{
  return _attributes.version;
}

- (void)setVersion:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setVersion, value);
  _attributes.version = value;
}

//The codecs used to encode/decode the media
- (NSArray *)codecs
{
  return _attributes.codecs;
}

- (void)setCodecs:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setCodecs, value);
  _attributes.codecs = value;
}

//Media types present in the content
- (NSArray *)mediaTypes
{
  return _attributes.mediaTypes;
}

- (void)setMediaTypes:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setMediaTypes, value);
  _attributes.mediaTypes = value;
}

//Whether the content is prepared for streaming.  Should be 0 for not streamable, 1 for streamable.
- (NSNumber *)streamable
{
  return _attributes.streamable;
}

- (void)setStreamable:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setStreamable, value);
  _attributes.streamable = value;
}

//The total bit rate (audio & video combined) of the media
- (NSNumber *)totalBitRate
{
  return _attributes.totalBitRate;
}

- (void)setTotalBitRate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setTotalBitRate, value);
  _attributes.totalBitRate = value;
}
//The video bit rate
- (NSNumber *)videoBitRate
{
  return _attributes.videoBitRate;
}

- (void)setVideoBitRate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setVideoBitRate, value);
  _attributes.videoBitRate = value;
}
//The audio bit rate
- (NSNumber *)audioBitRate
{
  return _attributes.audioBitRate;
}

- (void)setAudioBitRate:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setAudioBitRate, value);
  _attributes.audioBitRate = value;
}

//The delivery type of the item.  Should be 0 for fast start and 1 for RTSP.
- (NSNumber *)deliveryType
{
  return _attributes.deliveryType;
}

- (void)setDeliveryType:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setDeliveryType, value);
  _attributes.deliveryType = value;
}

//Used to indicate company/Organization that created the document.
- (NSArray *)organizations
{
  return _attributes.organizations;
}

- (void)setOrganizations:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setOrganizations, value);
  _attributes.organizations = value;
}

//Used to indicate the role of the document creator
- (NSString *)role
{
  return _attributes.role;
}

- (void)setRole:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setRole, value);
  _attributes.role = value;
}

//Used to designate the languages of the intellectual content of the
//resource. Recommended best practice for the values of the Language
//element is defined by BCP 47.
- (NSArray *)languages
{
  return _attributes.languages;
}

- (void)setLanguages:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setLanguages, value);
  _attributes.languages = value;
}

//Used to provide a link to information about rights held in and
//over the resource. Typically a Rights element will contain a
//rights management statement for the resource, or reference a
//service providing such information. Rights information often
//encompasses Intellectual Property Rights (IPR), Copyright, and
//various Property Rights. If the rights element is absent, no
//assumptions can be made about the status of these and other rights
//with respect to the resource.
- (NSString *)rights
{
  return _attributes.rights;
}

- (void)setRights:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setRights, value);
  _attributes.rights = value;
}

//Used to designate the entity responsible for making the resource
//available. Examples of a Publisher include a person, an
//organization, or a service. Typically, the name of a Publisher
//should be used to indicate the entity.
- (NSArray *)publishers
{
  return _attributes.publishers;
}

- (void)setPublishers:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setPublishers, value);
  _attributes.publishers = value;
}

//Used to designate the entity responsible for making contributions
//to the content of the resource. Examples of a Contributor include
//a person, an organization or a service. Typically, the name of a
//Contributor should be used to indicate the entity.
- (NSArray *)contributors
{
  return _attributes.contributors;
}

- (void)setContributors:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setContributors, value);
  _attributes.contributors = value;
}

//Used to designate the extent or scope of the content of the
//resource. Coverage will typically include spatial location
//(a place name or geographic co-ordinates), temporal period (a period label, date, or date range)
//or jurisdiction (such as a named administrative entity).
//Recommended best practice is to select a value from a controlled vocabulary, and that, where appropriate,
//named places or time periods be used in preference to numeric identifiers such as sets of co-ordinates or date ranges.
- (NSArray *)coverage
{
  return _attributes.coverage;
}

- (void)setCoverage:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setCoverage, value);
  _attributes.coverage = value;
}

//User rating of this item out of 5 stars
- (NSNumber *)rating
{
  return _attributes.rating;
}

- (void)setRating:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setRating, value);
  _attributes.rating = value;
}

//A description of the rating.  E.g. the number of reviewers.
- (NSString *)ratingDescription
{
  return _attributes.ratingDescription;
}

- (void)setRatingDescription:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setRatingDescription, value);
  _attributes.ratingDescription = value;
}

//User play count of this item
- (NSNumber *)playCount
{
  return _attributes.playCount;
}

- (void)setPlayCount:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setPlayCount, value);
  _attributes.playCount = value;
}

//Information about the item
- (NSString *)information
{
  return _attributes.information;
}

- (void)setInformation:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setInformation, value);
  _attributes.information = value;
}

//Director of the item (e.g. movie director)
- (NSString *)director
{
  return _attributes.director;
}

- (void)setDirector:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setDirector, value);
  _attributes.director = value;
}

//Producer of the content
- (NSString *)producer
{
  return _attributes.producer;
}

- (void)setProducer:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setProducer, value);
  _attributes.producer = value;
}

//Genre of the item (e.g. movie genre)
- (NSString *)genre
{
  return _attributes.genre;
}

- (void)setGenre:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setGenre, value);
  _attributes.genre = value;
}

//Performers in the movie
- (NSArray *)performers
{
  return _attributes.performers;
}

- (void)setPerformers:(id)value
{
  ENSURE_ARRAY(value);
  ENSURE_UI_THREAD(setPerformers, value);
  _attributes.performers = value;
}

//Original format of the movie
- (NSString *)originalFormat
{
  return _attributes.originalFormat;
}

- (void)setOriginalFormat:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setOriginalFormat, value);
  _attributes.originalFormat = value;
}

//Original source of the movie
- (NSString *)originalSource
{
  return _attributes.originalSource;
}

- (void)setOriginalSource:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setOriginalSource, value);
  _attributes.originalSource = value;
}

//Whether or not the item is local. Should be 1 if true, 0 otherwise.
- (NSNumber *)local
{
  return _attributes.local;
}

- (void)setLocal:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setLocal, value);
  _attributes.local = value;
}

//Whether or not the item has explicit content. Should be 1 if explicit, 0 for clean.
- (NSNumber *)contentRating
{
  return _attributes.contentRating;
}

- (void)setContentRating:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  ENSURE_UI_THREAD(setContentRating, value);
  _attributes.contentRating = value;
}
//URL of the item
- (NSString *)url
{
  return [_attributes.URL absoluteString];
}

- (void)setUrl:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setUrl, value);
  _attributes.URL = [self sanitizeURL:value];
  ;
}

// The fully formatted address of the item (obtained from MapKit)
- (NSString *)fullyFormattedAddress
{
  return [_attributes fullyFormattedAddress];
}

- (void)setFullyFormattedAddress:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setFullyFormattedAddress, value);
  [_attributes setFullyFormattedAddress:[TiUtils stringValue:value]];
}

// The postal code for the item according to guidelines established by the provider.
- (NSString *)postalCode
{
  return [_attributes postalCode];
}

- (void)setPostalCode:(id)value
{
  ENSURE_IOS_API(@"10", @"Ti.App.iOS.SearchableItemAttributSet.postalCode");
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setPostalCode, value);
  [_attributes setPostalCode:[TiUtils stringValue:value]];
}

// The sub-location (e.g., street number) for the item according to guidelines established by the provider.
- (NSString *)subThoroughfare
{
  return [_attributes subThoroughfare];
}

- (void)setSubThoroughfare:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setSubThoroughfare, value);
  [_attributes setSubThoroughfare:[TiUtils stringValue:value]];
}

// The location (e.g., street name) for the item according to guidelines established by the provider.
- (NSString *)thoroughfare
{
  return [_attributes thoroughfare];
}

- (void)setThoroughfare:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);
  ENSURE_UI_THREAD(setThoroughfare, value);
  [_attributes setThoroughfare:[TiUtils stringValue:value]];
}

@end
#endif
