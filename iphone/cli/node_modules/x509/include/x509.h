#ifndef __x509_h
#define __x509_h

// Include header for addon version, node/v8 inclusions, etc.
#include <addon.h>
#include <node_version.h>

// OpenSSL headers
#include <openssl/asn1.h>
#include <openssl/bio.h>
#include <openssl/err.h>
#include <openssl/pem.h>
#include <openssl/x509.h>
#include <openssl/x509v3.h>

using namespace v8;

#if NODE_VERSION_AT_LEAST(0, 11, 3) && defined(__APPLE__)
  void get_altnames(const FunctionCallbackInfo<Value> &args);
  void get_subject(const FunctionCallbackInfo<Value> &args);
  void get_issuer(const FunctionCallbackInfo<Value> &args);
  char* parse_args(const FunctionCallbackInfo<Value> &args);
  void parse_cert(const FunctionCallbackInfo<Value> &args);
#else
  Handle<Value> get_altnames(const Arguments &args);
  Handle<Value> get_subject(const Arguments &args);
  Handle<Value> get_issuer(const Arguments &args);
  Handle<Value> parse_cert(const Arguments &args);
#endif

Handle<Value> try_parse(char *data);
Handle<Value> parse_date(char *date);
Handle<Object> parse_name(X509_NAME *subject);
char* real_name(char *data);

#endif
