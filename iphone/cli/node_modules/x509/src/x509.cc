#include <cstring>

#include <x509.h>

using namespace v8;

// Field names that OpenSSL is missing.
char *MISSING[3][2] = {
  {
    (char*) "1.3.6.1.4.1.311.60.2.1.1",
    (char*) "jurisdictionOfIncorpationLocalityName"
  },

  {
    (char*) "1.3.6.1.4.1.311.60.2.1.2",
    (char*) "jurisdictionOfIncorporationStateOrProvinceName"
  },

  {
    (char*) "1.3.6.1.4.1.311.60.2.1.3",
    (char*) "jurisdictionOfIncorporationCountryName"
  }
};


#if NODE_VERSION_AT_LEAST(0, 11, 3) && defined(__APPLE__)
/*
 * Code for 0.11.3 and higher.
 */
void get_altnames(const FunctionCallbackInfo<Value> &args) {
  Local<Object> exports(try_parse(parse_args(args))->ToObject());
  args.GetReturnValue().Set(exports->Get(String::NewSymbol("altNames")));
}

void get_subject(const FunctionCallbackInfo<Value> &args) {
  Local<Object> exports(try_parse(parse_args(args))->ToObject());
  args.GetReturnValue().Set(exports->Get(String::NewSymbol("subject")));
}

void get_issuer(const FunctionCallbackInfo<Value> &args) {
  Local<Object> exports(try_parse(parse_args(args))->ToObject());
  args.GetReturnValue().Set(exports->Get(String::NewSymbol("issuer")));
}

char* parse_args(const FunctionCallbackInfo<Value> &args) {
  if (args.Length() == 0) {
    ThrowException(Exception::Error(String::New("Must provide a certificate file.")));
    return NULL;
  }

  if (!args[0]->IsString()) {
    ThrowException(Exception::TypeError(String::New("Certificate must be a string.")));
    return NULL;
  }

  if (args[0]->ToString()->Length() == 0) {
    ThrowException(Exception::TypeError(String::New("Certificate argument provided, but left blank.")));
    return NULL;
  }

  char *value = (char*) malloc(sizeof(char*) * args[0]->ToString()->Length());
  sprintf(value, "%s", *String::Utf8Value(args[0]->ToString()));
  return value;
}

void parse_cert(const FunctionCallbackInfo<Value> &args) {
  Local<Object> exports(try_parse(parse_args(args))->ToObject());
  args.GetReturnValue().Set(exports);
}

#else
/*
 * Code for 0.11.2 and lower.
 */
Handle<Value> get_altnames(const Arguments &args) {
  HandleScope scope;
  Handle<Object> exports(Handle<Object>::Cast(parse_cert(args)));

  return scope.Close(exports->Get(String::NewSymbol("altNames")));
}

Handle<Value> get_subject(const Arguments &args) {
  HandleScope scope;
  Handle<Object> exports(Handle<Object>::Cast(parse_cert(args)));

  return scope.Close(exports->Get(String::NewSymbol("subject")));
}

Handle<Value> get_issuer(const Arguments &args) {
  HandleScope scope;
  Handle<Object> exports(Handle<Object>::Cast(parse_cert(args)));

  return scope.Close(exports->Get(String::NewSymbol("issuer")));
}

Handle<Value> parse_cert(const Arguments &args) {
  HandleScope scope;

  if (args.Length() == 0) {
    ThrowException(Exception::Error(String::New("Must provide a certificate file.")));
    return scope.Close(Undefined());
  }

  if (!args[0]->IsString()) {
    ThrowException(Exception::TypeError(String::New("Certificate must be a string.")));
    return scope.Close(Undefined());
  }

  if (args[0]->ToString()->Length() == 0) {
    ThrowException(Exception::TypeError(String::New("Certificate argument provided, but left blank.")));
    return scope.Close(Undefined());
  }

  String::Utf8Value value(args[0]);
  return scope.Close(try_parse(*value));
}
#endif // NODE_VERSION_AT_LEAST



/*
 * This is where everything is handled for both -0.11.2 and 0.11.3+.
 */
Handle<Value> try_parse(char *data) {
  HandleScope scope;
  Handle<Object> exports(Object::New());
  X509 *cert;

  BIO *bio = BIO_new(BIO_s_mem());
  int result = BIO_puts(bio, data);

  if (result == -2) {
    ThrowException(Exception::Error(String::New("BIO doesn't support BIO_puts.")));
    return scope.Close(exports);
  }
  else if (result <= 0) {
    ThrowException(Exception::Error(String::New("No data was written to BIO.")));
    return scope.Close(exports);
  }

  // Try raw read
  cert = PEM_read_bio_X509(bio, NULL, 0, NULL);

  if (cert == NULL) {
    // Switch to file BIO
    bio = BIO_new(BIO_s_file());

    // If raw read fails, try reading the input as a filename.
    if (!BIO_read_filename(bio, data)) {
      ThrowException(Exception::Error(String::New("File doesn't exist.")));
      return scope.Close(exports);
    }

    // Try reading the bio again with the file in it.
    cert = PEM_read_bio_X509(bio, NULL, 0, NULL);

    if (cert == NULL) {
      ThrowException(Exception::Error(String::New("Unable to parse certificate.")));
      return scope.Close(exports);
    }
  }

  exports->Set(String::NewSymbol("subject"), parse_name(X509_get_subject_name(cert)));
  exports->Set(String::NewSymbol("issuer"), parse_name(X509_get_issuer_name(cert)));
  exports->Set(String::NewSymbol("notBefore"), parse_date((char*) ASN1_STRING_data(X509_get_notBefore(cert))));
  exports->Set(String::NewSymbol("notAfter"), parse_date((char*) ASN1_STRING_data(X509_get_notAfter(cert))));

  Local<Array> altNames(Array::New());
  STACK_OF(GENERAL_NAME) *names = NULL;
  int i;

  names = (STACK_OF(GENERAL_NAME)*) X509_get_ext_d2i(cert, NID_subject_alt_name, NULL, NULL);

  if (names != NULL) {
    int length = sk_GENERAL_NAME_num(names);
    for (i = 0; i < length; i++) {
      GENERAL_NAME *current = sk_GENERAL_NAME_value(names, i);

      if (current->type == GEN_DNS) {
        char *name = (char*) ASN1_STRING_data(current->d.dNSName);

        if (ASN1_STRING_length(current->d.dNSName) != (int) strlen(name)) {
          ThrowException(Exception::Error(String::New("Malformed alternative names field.")));
          return scope.Close(exports);
        }

        altNames->Set(i, String::New(name));
      }
    }
  }

  exports->Set(String::NewSymbol("altNames"), altNames);

  X509_free(cert);

#if NODE_VERSION_AT_LEAST(0, 11, 3) && defined(__APPLE__)
  free(data);
#endif

  return scope.Close(exports);
}

Handle<Value> parse_date(char *date) {
  HandleScope scope;
  char current[3];
  int i;
  Local<Array> dateArray(Array::New());
  Local<String> output(String::New(""));
  Local<Value> args[1];

  for (i = 0; i < (int) strlen(date) - 1; i += 2) {
    strncpy(current, &date[i], 2);
    current[2] = '\0';

    dateArray->Set((i / 2), String::New(current));
  }

  output = String::Concat(output, String::Concat(dateArray->Get(1)->ToString(), String::New("/")));
  output = String::Concat(output, String::Concat(dateArray->Get(2)->ToString(), String::New("/")));
  output = String::Concat(output, String::Concat(String::New("20"), dateArray->Get(0)->ToString()));
  output = String::Concat(output, String::New(" "));
  output = String::Concat(output, String::Concat(dateArray->Get(3)->ToString(), String::New(":")));
  output = String::Concat(output, String::Concat(dateArray->Get(4)->ToString(), String::New(":")));
  output = String::Concat(output, String::Concat(dateArray->Get(5)->ToString(), String::New(" GMT")));

  args[0] = output;

  return scope.Close(Context::GetCurrent()->Global()->Get(String::New("Date"))->ToObject()->CallAsConstructor(1, args));
}

Handle<Object> parse_name(X509_NAME *subject) {
  HandleScope scope;
  Handle<Object> cert(Object::New());
  int i, length;
  ASN1_OBJECT *entry;
  unsigned char *value;
  char buf[255];
  length = X509_NAME_entry_count(subject);
  for (i = 0; i < length; i++) {
    entry = X509_NAME_ENTRY_get_object(X509_NAME_get_entry(subject, i));
    OBJ_obj2txt(buf, 255, entry, 0);
    value = ASN1_STRING_data(X509_NAME_ENTRY_get_data(X509_NAME_get_entry(subject, i)));
    cert->Set(String::NewSymbol(real_name(buf)), String::New((const char*) value));
  }
  return scope.Close(cert);
}

// Fix for missing fields in OpenSSL.
char* real_name(char *data) {
  int i, length = (int) sizeof(MISSING) / sizeof(MISSING[0]);

  for (i = 0; i < length; i++) {
    if (strcmp(data, MISSING[i][0]) == 0)
      return MISSING[i][1];
  }

  return data;
}
