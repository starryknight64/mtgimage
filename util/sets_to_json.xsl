<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output indent="no" omit-xml-declaration="yes" method="text"/>
	<xsl:template match="/cockatrice_setdatabase">
		<xsl:text>[</xsl:text>
		<xsl:for-each select="set">
			<xsl:if test="position()!=1">
				<xsl:text>,</xsl:text>
			</xsl:if>
			<xsl:text>"</xsl:text>
			<xsl:value-of select="name/text()"/>
			<xsl:text>"</xsl:text>
		</xsl:for-each>
		<xsl:text>]</xsl:text>
	</xsl:template>
</xsl:stylesheet>
