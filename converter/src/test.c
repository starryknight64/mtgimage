#include <stdlib.h>
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <sys/types.h>
#include <time.h>
char * strstrstrip(char * haystack, char * needle)
{
	char * loc=0;
	size_t haystack_size=strlen(haystack);
	size_t needle_size=strlen(needle);

	while((loc=strstr(haystack, needle))!=NULL)
	{
		haystack_size -= needle_size;
		memmove(loc, loc+needle_size, haystack_size);
	}

	return haystack;
}

int main(int argc, char ** argv)
{
	char result[4096] = "this is z-zz-z a long z-ztest of tz-zhe strip code";
	strstrstrip(result, "z-z");

	return 0;
}


