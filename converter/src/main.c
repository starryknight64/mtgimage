#include <stdlib.h>
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <sys/types.h>
#include <time.h>

void convert(char * utf_src, ssize_t utfsrc_len, char (* result)[4096]);

/*int main(int argc, char ** argv)
{
	char result[4096] = {0};
	clock_t start, diff;
	uint32_t i=0;

	printf("BEFORE: %s\n", argv[1]);
	
	start = clock();
	for(i=0;i<100000;i++)
	{
		convert(argv[1], strlen(argv[1]), &result);
	}
	diff = clock() - start;

	printf("AFTER: %s\n", result);

	int msec = diff * 1000 / CLOCKS_PER_SEC;
	printf("Time taken %d seconds %d milliseconds (%ld)\n", msec/1000, msec%1000, msec);

	return 0;
}*/

int main(int argc, char ** argv)
{
	char result[4096] = {0};
	convert(argv[1], strlen(argv[1]), &result);
	printf("%s", result);

	return 0;
}

