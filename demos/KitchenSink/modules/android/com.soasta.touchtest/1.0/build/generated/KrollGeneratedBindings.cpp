/* C++ code produced by gperf version 3.0.3 */
/* Command-line: gperf -L C++ -E -t /private/var/folders/zw/n1jmn7z52yb6x0rfd2cn5bgr0000gq/T/nle/touchtestmodule-generated/KrollGeneratedBindings.gperf  */
/* Computed positions: -k'' */

#line 3 "/private/var/folders/zw/n1jmn7z52yb6x0rfd2cn5bgr0000gq/T/nle/touchtestmodule-generated/KrollGeneratedBindings.gperf"


#include <string.h>
#include <v8.h>
#include <KrollBindings.h>

#include "com.soasta.touchtest.TouchtestmoduleModule.h"


#line 13 "/private/var/folders/zw/n1jmn7z52yb6x0rfd2cn5bgr0000gq/T/nle/touchtestmodule-generated/KrollGeneratedBindings.gperf"
struct titanium::bindings::BindEntry;
/* maximum key range = 1, duplicates = 0 */

class TouchtestmoduleBindings
{
private:
  static inline unsigned int hash (const char *str, unsigned int len);
public:
  static struct titanium::bindings::BindEntry *lookupGeneratedInit (const char *str, unsigned int len);
};

inline /*ARGSUSED*/
unsigned int
TouchtestmoduleBindings::hash (register const char *str, register unsigned int len)
{
  return len;
}

struct titanium::bindings::BindEntry *
TouchtestmoduleBindings::lookupGeneratedInit (register const char *str, register unsigned int len)
{
  enum
    {
      TOTAL_KEYWORDS = 1,
      MIN_WORD_LENGTH = 42,
      MAX_WORD_LENGTH = 42,
      MIN_HASH_VALUE = 42,
      MAX_HASH_VALUE = 42
    };

  static struct titanium::bindings::BindEntry wordlist[] =
    {
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""}, {""},
      {""}, {""}, {""}, {""}, {""}, {""},
#line 15 "/private/var/folders/zw/n1jmn7z52yb6x0rfd2cn5bgr0000gq/T/nle/touchtestmodule-generated/KrollGeneratedBindings.gperf"
      {"com.soasta.touchtest.TouchtestmoduleModule", ::com::soasta::touchtest::TouchtestmoduleModule::bindProxy, ::com::soasta::touchtest::TouchtestmoduleModule::dispose}
    };

  if (len <= MAX_WORD_LENGTH && len >= MIN_WORD_LENGTH)
    {
      register int key = hash (str, len);

      if (key <= MAX_HASH_VALUE && key >= 0)
        {
          register const char *s = wordlist[key].name;

          if (*str == *s && !strcmp (str + 1, s + 1))
            return &wordlist[key];
        }
    }
  return 0;
}
#line 16 "/private/var/folders/zw/n1jmn7z52yb6x0rfd2cn5bgr0000gq/T/nle/touchtestmodule-generated/KrollGeneratedBindings.gperf"

