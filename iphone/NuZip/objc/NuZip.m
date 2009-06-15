/*!
@file NuZip.m
@discussion Objective-C wrapper for Gilles Vollant's Minizip library.
@copyright Copyright (c) 2008 Neon Design Technology, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

#import "NuZip.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <errno.h>
#include <fcntl.h>
# include <sys/stat.h>

# include <unistd.h>
# include <utime.h>

#include "unzip.h"
#include "zip.h"

//static int opt_quiet = 0;
int nuzip_printf(const char *format, ...)
{
//    if (!opt_quiet) {
//        va_list ap;
//        va_start(ap, format);
//        vprintf(format, ap);
//        va_end(ap);
//    }
	return 0;
}

void change_file_date(const char *filename, tm_unz tmu_date);
int mymkdir(const char *dirname);
int makedir (char *newdir);
int do_extract_currentfile(unzFile uf, const char *password);
int do_extract(unzFile uf, const char *password);

int unzip_main(NSString * inputPath, NSString * outputPath, NSString * passwordString);

@implementation NuZip

+ (BOOL) unzip: (NSString *) inputPath toFolder: (NSString *) outputPath password:(NSString *) passwordString error:(NSError **) error;
{
	//This version is less forgiving than the origional. If the file name isn't perfect, it doesn't try appending a .zip to it.
	NSFileManager * theFM = [[NSFileManager alloc] init];
	NSString * oldWorkingPath = [theFM currentDirectoryPath];
	[theFM changeCurrentDirectoryPath:outputPath];

    unzFile uf=unzOpen([inputPath fileSystemRepresentation]);
    if (uf == NULL) {
		if (error) {
			*error = [NSError errorWithDomain:@"com.appcelerator.zip" code:1
									 userInfo:[NSDictionary dictionaryWithObject:@"File missing" forKey:NSLocalizedDescriptionKey]];
		}
		[theFM release];
        return NO;
    }
	int result = do_extract(uf,[passwordString UTF8String]);
	unzClose(uf);
	
	[theFM changeCurrentDirectoryPath:oldWorkingPath];
	[theFM release];

	if (error) {
		if (result != UNZ_OK){
			*error = [NSError errorWithDomain:@"com.appcelerator.zip" code:result
									 userInfo:[NSDictionary dictionaryWithObject:@"Failure in unpacking" forKey:NSLocalizedDescriptionKey]];
		} else { *error = nil; }
	}
	return result == UNZ_OK;
}

@end

/*
   miniunz.c
   Version 1.01e, February 12th, 2005

   Copyright (C) 1998-2005 Gilles Vollant
*/

#define CASESENSITIVITY (0)
#define MAXFILENAME (256)
#define WRITEBUFFERSIZE (16384)

/*
  list the file in the zipfile, and print the content of FILE_ID.ZIP or README.TXT
    if it exists
*/

/* change_file_date : change the date/time of a file
    filename : the filename of the file where date/time must be modified
    tmu_date : the SAME new date at the tm_unz format */
void change_file_date(const char *filename, tm_unz tmu_date)
{
    struct utimbuf ut;
    struct tm newdate;
    newdate.tm_sec = tmu_date.tm_sec;
    newdate.tm_min=tmu_date.tm_min;
    newdate.tm_hour=tmu_date.tm_hour;
    newdate.tm_mday=tmu_date.tm_mday;
    newdate.tm_mon=tmu_date.tm_mon;
    if (tmu_date.tm_year > 1900)
        newdate.tm_year=tmu_date.tm_year - 1900;
    else
        newdate.tm_year=tmu_date.tm_year ;
    newdate.tm_isdst=-1;

    ut.actime=ut.modtime=mktime(&newdate);
    utime(filename,&ut);
}

/* mymkdir and change_file_date are not 100 % portable
   As I don't know well Unix, I wait feedback for the unix portion */

int mymkdir(const char *dirname)
{
    int ret=0;
    ret = mkdir (dirname,0775);
    return ret;
}

int makedir (char *newdir)
{
    char *buffer ;
    char *p;
    int  len = (int)strlen(newdir);

    if (len <= 0)
        return 0;

    buffer = (char*)malloc(len+1);
    strcpy(buffer,newdir);

    if (buffer[len-1] == '/') {
        buffer[len-1] = '\0';
    }
    if (mymkdir(buffer) == 0) {
        free(buffer);
        return 1;
    }

    p = buffer+1;
    while (1) {
        char hold;

        while(*p && *p != '\\' && *p != '/')
            p++;
        hold = *p;
        *p = 0;
        if ((mymkdir(buffer) == -1) && (errno == ENOENT)) {
            nuzip_printf("couldn't create directory %s\n",buffer);
            free(buffer);
            return 0;
        }
        if (hold == 0)
            break;
        *p++ = hold;
    }
    free(buffer);
    return 1;
}

//    nuzip_printf("more info at http://www.winimage.com/zLibDll/unzip.html\n\n");

int do_extract_currentfile(unzFile uf, const char *password)
{
    char filename_inzip[256];
    char* filename_withoutpath;
    char* p;
    int err=UNZ_OK;
    FILE *fout=NULL;
    void* buf;
    uInt size_buf;

    unz_file_info file_info;
//    uLong ratio=0;
    err = unzGetCurrentFileInfo(uf,&file_info,filename_inzip,sizeof(filename_inzip),NULL,0,NULL,0);

    if (err!=UNZ_OK) {
        nuzip_printf("error %d with zipfile in unzGetCurrentFileInfo\n",err);
        return err;
    }

    size_buf = WRITEBUFFERSIZE;
    buf = (void*)malloc(size_buf);
    if (buf==NULL) {
        nuzip_printf("Error allocating memory\n");
        return UNZ_INTERNALERROR;
    }

    p = filename_withoutpath = filename_inzip;
    while ((*p) != '\0') {
        if (((*p)=='/') || ((*p)=='\\'))
            filename_withoutpath = p+1;
        p++;
    }

    if ((*filename_withoutpath)=='\0') {
            nuzip_printf("creating directory: %s\n",filename_inzip);
            mymkdir(filename_inzip);
    }
    else {
        char* write_filename;
        int skip=0;

		write_filename = filename_inzip;

        err = unzOpenCurrentFilePassword(uf,password);
        if (err!=UNZ_OK) {
            nuzip_printf("error %d with zipfile in unzOpenCurrentFilePassword\n",err);
        }

        if ((skip==0) && (err==UNZ_OK)) {
            fout=fopen(write_filename,"wb");

            /* some zipfile don't contain directory alone before file */
            if ((fout==NULL) &&
            (filename_withoutpath!=(char*)filename_inzip)) {
                char c=*(filename_withoutpath-1);
                *(filename_withoutpath-1)='\0';
                makedir(write_filename);
                *(filename_withoutpath-1)=c;
                fout=fopen(write_filename,"wb");
            }

            if (fout==NULL) {
                nuzip_printf("error opening %s\n",write_filename);
            }
        }

        if (fout!=NULL) {
            nuzip_printf(" extracting: %s\n",write_filename);

            do {
                err = unzReadCurrentFile(uf,buf,size_buf);
                if (err<0) {
                    nuzip_printf("error %d with zipfile in unzReadCurrentFile\n",err);
                    break;
                }
                if (err>0)
                if (fwrite(buf,err,1,fout)!=1) {
                    nuzip_printf("error in writing extracted file\n");
                    err=UNZ_ERRNO;
                    break;
                }
            }
            while (err>0);
            if (fout)
                fclose(fout);

            if (err==0)
                change_file_date(write_filename,
                    file_info.tmu_date);
        }

        if (err==UNZ_OK) {
            err = unzCloseCurrentFile (uf);
            if (err!=UNZ_OK) {
                nuzip_printf("error %d with zipfile in unzCloseCurrentFile\n",err);
            }
        }
        else
            unzCloseCurrentFile(uf);              /* don't lose the error */
    }

    free(buf);
    return err;
}

int do_extract(unzFile uf, const char *password)
{
    uLong i;
    unz_global_info gi;
    int err;
    err = unzGetGlobalInfo (uf,&gi);
    if (err!=UNZ_OK)
        nuzip_printf("error %d with zipfile in unzGetGlobalInfo \n",err);

    for (i=0;i<gi.number_entry;i++) {
		err = do_extract_currentfile(uf,password);
        if (err != UNZ_OK)
            break;

        if ((i+1)<gi.number_entry) {
            err = unzGoToNextFile(uf);
            if (err!=UNZ_OK) {
                nuzip_printf("error %d with zipfile in unzGoToNextFile\n",err);
                break;
            }
        }
    }

    return err;
}
