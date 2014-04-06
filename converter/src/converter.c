#include <stdlib.h>
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <sys/types.h>
#include <time.h>
#include <inttypes.h>
#include <limits.h>

// See which letter at: http://www.codetable.net/decimal/162
static const char * utf8_to_ascii[] =
{
	[192] = "a",
	[193] = "a",
	[194] = "a",
	[195] = "a",
	[196] = "a",
	[197] = "a",
	[198] = "ae",
	[199] = "c",
	[200] = "e",
	[201] = "e",
	[202] = "e",
	[203] = "e",
	[204] = "i",
	[205] = "i",
	[206] = "i",
	[207] = "i",
	[208] = "d",
	[209] = "n",
	[210] = "o",
	[211] = "o",
	[212] = "o",
	[213] = "o",
	[214] = "o",
	[336] = "o",
	[216] = "o",
	[217] = "u",
	[218] = "u",
	[219] = "u",
	[220] = "u",
	[368] = "u",
	[221] = "y",
	[222] = "th",
	[223] = "ss",
	[224] = "a",
	[225] = "a",
	[226] = "a",
	[227] = "a",
	[228] = "a",
	[229] = "a",
	[230] = "ae",
	[231] = "c",
	[232] = "e",
	[233] = "e",
	[234] = "e",
	[235] = "e",
	[236] = "i",
	[237] = "i",
	[238] = "i",
	[239] = "i",
	[240] = "d",
	[241] = "n",
	[242] = "o",
	[243] = "o",
	[244] = "o",
	[245] = "o",
	[246] = "o",
	[337] = "o",
	[248] = "o",
	[249] = "u",
	[250] = "u",
	[251] = "u",
	[252] = "u",
	[369] = "u",
	[253] = "y",
	[254] = "th",
	[255] = "y",
	[7838] = "ss",
	[945] = "a",
	[946] = "b",
	[947] = "g",
	[948] = "d",
	[949] = "e",
	[950] = "z",
	[951] = "h",
	[952] = "8",
	[953] = "i",
	[954] = "k",
	[955] = "l",
	[956] = "m",
	[957] = "n",
	[958] = "3",
	[959] = "o",
	[960] = "p",
	[961] = "r",
	[963] = "s",
	[964] = "t",
	[965] = "y",
	[966] = "f",
	[967] = "x",
	[968] = "ps",
	[969] = "w",
	[940] = "a",
	[941] = "e",
	[943] = "i",
	[972] = "o",
	[973] = "y",
	[942] = "h",
	[974] = "w",
	[962] = "s",
	[970] = "i",
	[944] = "y",
	[971] = "y",
	[912] = "i",
	[913] = "a",
	[914] = "b",
	[915] = "g",
	[916] = "d",
	[917] = "e",
	[918] = "z",
	[919] = "h",
	[920] = "8",
	[921] = "i",
	[922] = "k",
	[923] = "l",
	[924] = "m",
	[925] = "n",
	[926] = "3",
	[927] = "o",
	[928] = "p",
	[929] = "r",
	[931] = "s",
	[932] = "t",
	[933] = "y",
	[934] = "f",
	[935] = "x",
	[936] = "ps",
	[937] = "w",
	[902] = "a",
	[904] = "e",
	[906] = "i",
	[908] = "o",
	[910] = "y",
	[905] = "h",
	[911] = "w",
	[938] = "i",
	[939] = "y",
	[351] = "s",
	[350] = "s",
	[305] = "i",
	[304] = "i",
	[287] = "g",
	[286] = "g",
	[1072] = "a",
	[1073] = "b",
	[1074] = "v",
	[1075] = "g",
	[1076] = "d",
	[1077] = "e",
	[1105] = "yo",
	[1078] = "zh",
	[1079] = "z",
	[1080] = "i",
	[1081] = "j",
	[1082] = "k",
	[1083] = "l",
	[1084] = "m",
	[1085] = "n",
	[1086] = "o",
	[1087] = "p",
	[1088] = "r",
	[1089] = "s",
	[1090] = "t",
	[1091] = "u",
	[1092] = "f",
	[1093] = "h",
	[1094] = "c",
	[1095] = "ch",
	[1096] = "sh",
	[1097] = "sh",
	[1098] = "u",
	[1099] = "y",
	[1100] = "",
	[1101] = "e",
	[1102] = "yu",
	[1103] = "ya",
	[1040] = "a",
	[1041] = "b",
	[1042] = "v",
	[1043] = "g",
	[1044] = "d",
	[1045] = "e",
	[1025] = "yo",
	[1046] = "zh",
	[1047] = "z",
	[1048] = "i",
	[1049] = "j",
	[1050] = "k",
	[1051] = "l",
	[1052] = "m",
	[1053] = "n",
	[1054] = "o",
	[1055] = "p",
	[1056] = "r",
	[1057] = "s",
	[1058] = "t",
	[1059] = "u",
	[1060] = "f",
	[1061] = "h",
	[1062] = "c",
	[1063] = "ch",
	[1064] = "sh",
	[1065] = "sh",
	[1066] = "u",
	[1067] = "y",
	[1068] = "",
	[1069] = "e",
	[1070] = "yu",
	[1071] = "ya",
	[1028] = "ye",
	[1030] = "i",
	[1031] = "yi",
	[1168] = "g",
	[1108] = "ye",
	[1110] = "i",
	[1111] = "yi",
	[1169] = "g",
	[269] = "c",
	[271] = "d",
	[283] = "e",
	[328] = "n",
	[345] = "r",
	[353] = "s",
	[357] = "t",
	[367] = "u",
	[382] = "z",
	[268] = "c",
	[270] = "d",
	[282] = "e",
	[327] = "n",
	[344] = "r",
	[352] = "s",
	[356] = "t",
	[366] = "u",
	[381] = "z",
	[261] = "a",
	[263] = "c",
	[281] = "e",
	[322] = "l",
	[324] = "n",
	[347] = "s",
	[378] = "z",
	[380] = "z",
	[260] = "a",
	[262] = "c",
	[280] = "e",
	[321] = "l",
	[323] = "n",
	[346] = "s",
	[377] = "z",
	[379] = "z",
	[257] = "a",
	[275] = "e",
	[291] = "g",
	[299] = "i",
	[311] = "k",
	[316] = "l",
	[326] = "n",
	[363] = "u",
	[256] = "a",
	[274] = "e",
	[290] = "g",
	[298] = "i",
	[310] = "k",
	[315] = "l",
	[325] = "n",
	[362] = "u",
	[9] = "\t",
	[10] = "\n",
	[13] = "\r",
	[32] = " ",
	[33] = "!",
	[34] = "\"",
	[35] = "#",
	[36] = "$",
	[37] = "%",
	[38] = "&",
	[39] = "'",
	[40] = "(",
	[41] = ")",
	[42] = "*",
	[43] = "+",
	[44] = ",",
	[45] = "-",
	[46] = ".",
	[47] = " ",
	[48] = "0",
	[49] = "1",
	[50] = "2",
	[51] = "3",
	[52] = "4",
	[53] = "5",
	[54] = "6",
	[55] = "7",
	[56] = "8",
	[57] = "9",
	[58] = ":",
	[59] = ";",
	[60] = "<",
	[61] = "=",
	[62] = ">",
	[63] = "?",
	[64] = "@",
	[65] = "a",
	[66] = "b",
	[67] = "c",
	[68] = "d",
	[69] = "e",
	[70] = "f",
	[71] = "g",
	[72] = "h",
	[73] = "i",
	[74] = "j",
	[75] = "k",
	[76] = "l",
	[77] = "m",
	[78] = "n",
	[79] = "o",
	[80] = "p",
	[81] = "q",
	[82] = "r",
	[83] = "s",
	[84] = "t",
	[85] = "u",
	[86] = "v",
	[87] = "w",
	[88] = "x",
	[89] = "y",
	[90] = "z",
	[91] = "[",
	[92] = "\\",
	[93] = "]",
	[94] = "^",
	[95] = " ",
	[96] = "`",
	[97] = "a",
	[98] = "b",
	[99] = "c",
	[100] = "d",
	[101] = "e",
	[102] = "f",
	[103] = "g",
	[104] = "h",
	[105] = "i",
	[106] = "j",
	[107] = "k",
	[108] = "l",
	[109] = "m",
	[110] = "n",
	[111] = "o",
	[112] = "p",
	[113] = "q",
	[114] = "r",
	[115] = "s",
	[116] = "t",
	[117] = "u",
	[118] = "v",
	[119] = "w",
	[120] = "x",
	[121] = "y",
	[122] = "z",
	[123] = "{",
	[124] = "|",
	[125] = "}",
	[126] = "~",
	[174] = "r",
	[162] = "c",
	[173] = "-",
	[186] = "o",
	[182] = "p",
	[160] = " ",
	[8220] = "\"",
	[8221] = "\""
};

#define MAX_UTF_CODE 8221

// See which letter at: http://www.codetable.net/decimal/162

const int8_t utf8proc_utf8class[256] = {
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
	2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
	2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
	3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
	4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0 };

static ssize_t utf8proc_iterate(const uint8_t *str, ssize_t strlen, int32_t *dst)
{
	int length;
	int i;
	int32_t uc = -1;
	*dst = -1;

	if(!strlen)
		return 0;

	length = utf8proc_utf8class[str[0]];

	if(!length)
		return -1;

	if(strlen >= 0 && length > strlen)
		return -1;

	for(i=1; i<length; i++)
	{
		if((str[i] & 0xC0)!=0x80)
			return -1;
	}

	switch(length)
	{
		case 1:
			uc = str[0];
			break;

		case 2:
			uc = ((str[0] & 0x1F) << 6) + (str[1] & 0x3F);
			if(uc<0x80)
				uc = -1;
			break;

		case 3:
			uc = ((str[0] & 0x0F) << 12) + ((str[1] & 0x3F) << 6) + (str[2] & 0x3F);
			if(uc<0x800 || (uc>=0xD800 && uc<0xE000) || (uc>=0xFDD0 && uc<0xFDF0))
				uc = -1;
			break;

		case 4:
			uc = ((str[0] & 0x07) << 18) + ((str[1] & 0x3F) << 12) + ((str[2] & 0x3F) << 6) + (str[3] & 0x3F);
			if(uc<0x10000 || uc>=0x110000)
				uc = -1;
			break;
	}

	if(uc < 0 || ((uc & 0xFFFF) >= 0xFFFE))
		return -1;

	*dst = uc;

	return length;
}

size_t strchrncount(char * haystack, char needle, size_t max)
{
	size_t i=0;
	size_t count=0;

	if(!haystack)
		return 0;

	while(*haystack && count<max)
	{
		if(*haystack==needle)
			i++;

		haystack++;
		count++;
	}

	return i;
}

unsigned char strendswith(char * haystack, char * needle)
{
	if(!haystack || !(*haystack) || !needle || !(*needle))
		return 0;

	if(strlen(needle)>strlen(haystack))
		return 0;

	if(!strcmp(haystack+(strlen(haystack)-strlen(needle)), needle))
		return 1;

	return 0;
}

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

static const char SET_PREFIX[] = " set ";
static const char CARD_PREFIX[] = " card ";
static const char SETNAME_PREFIX[] = " setname ";
static const char MULTIVERSEID_PREFIX[] = " multiverseid ";
static const char UNKNOWN_UTF_CODE[] = "x";

void convert(char * utf_src, ssize_t utfsrc_len, char (* result)[4096])
{
	int32_t utf_code;
	ssize_t utf_count=0;
	uint16_t result_count=0;
	size_t result_length;
	const char * c;
	char * slash_loc;

	while(utf_count<utfsrc_len && result_count<4095)
	{
		utf_count += utf8proc_iterate((const uint8_t *)(utf_src+utf_count), -1, &utf_code);
		if(utf_code==-1)
			break;

		if(utf_code > MAX_UTF_CODE || !utf8_to_ascii[utf_code])
		{
			fprintf(stderr, "Missing UTF conversion for code: %d %s\n", utf_code, (const uint8_t *)(utf_src+(utf_count-1)));
			// See which letter at: http://www.codetable.net/decimal/162
			c=UNKNOWN_UTF_CODE;
		}
		else
		{
			c=utf8_to_ascii[utf_code];
		}

		for(;*c!=0 && result_count<4095;c++)
		{
			if(c[0]==':' || c[0]=='"' || c[0]=='?')
				continue;

			(*result)[result_count++] = c[0];
		}
	}

	result_length = strlen((const char *)result);

	if(strendswith((*result), ".full.jpg"))
		sprintf((*result)+(result_length-8), "jpg");
	else if(strendswith((*result), ".full.hq.jpg"))
		sprintf((*result)+(result_length-11), "jpg");
	else if(strendswith((*result), "-crop.jpg"))
		(*result)[result_length-9] = '.';
	else if(strendswith((*result), "-crop.hq.jpg"))
		(*result)[result_length-12] = '.';

	strstrstrip((*result), " - ");

	result_length = strlen((const char *)result);

	if(!memcmp(SET_PREFIX, (*result), sizeof(SET_PREFIX)-1))
	{
		(*result)[0] = '/';
		(*result)[4] = '/';
		slash_loc = strchr(utf_src+5, '/');
		if(slash_loc && slash_loc>utf_src && result_length>(size_t)(slash_loc-utf_src))
			(*result)[(slash_loc-utf_src)-(strchrncount(utf_src+5, ':', slash_loc-(utf_src+5))+strchrncount(utf_src+5, '"', slash_loc-(utf_src+5))+strchrncount(utf_src+5, '?', slash_loc-(utf_src+5)))] = '/';
	}
	else if(!memcmp(CARD_PREFIX, *result, sizeof(CARD_PREFIX)-1))
	{
		(*result)[0] = '/';
		(*result)[5] = '/';
	}
	else if(!memcmp(MULTIVERSEID_PREFIX, *result, sizeof(MULTIVERSEID_PREFIX)-1))
	{
		(*result)[0] = '/';
		(*result)[13] = '/';
	}
	else if(!memcmp(SETNAME_PREFIX, *result, sizeof(SETNAME_PREFIX)-1))
	{
		(*result)[0] = '/';
		(*result)[8] = '/';
		slash_loc = strchr(utf_src+9, '/');
		if(slash_loc && slash_loc>utf_src && result_length>(size_t)(slash_loc-utf_src))
			(*result)[(slash_loc-utf_src)-(strchrncount(utf_src+9, ':', slash_loc-(utf_src+9))+strchrncount(utf_src+9, '"', slash_loc-(utf_src+9))+strchrncount(utf_src+9, '?', slash_loc-(utf_src+9)))] = '/';
	}
}
