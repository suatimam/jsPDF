/**
 * jsPDF Sign PlugIn
 * Copyright (c) 2015 Jan Slabon (Setasign)  jan.slabon@setasign.com
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */

(function (jsPDFAPI) {
	'use strict';

	if (jsPDFAPI.acroFormPlugin == undefined) {
		throw new Error("Sign plugin requires the AcroForm plugin.");
	}

	jsPDFAPI.events.push([
	   'putResources', function() {
			if (null === this.signPlugin.valueObjId)
				return;

			this.internal.newObjectDeferredBegin(this.signPlugin.valueObjId);
			this.internal.write(this.signPlugin.valueObjId + ' 0 obj');
			this.internal.write('<</Type /Sig /Filter /Adobe.PPKMS');
			this.internal.write('/SubFilter /adbe.pkcs7.detached');

			var gap = [];

			this.signPlugin.byteRange[1] = this.internal.getContentLenght() + '/Contents'.length;

			for (var i = this.signPlugin.gapSize + 2; i > 0; i--) {
				gap.push('\0');
			}

			gap = gap.join('');

			this.signPlugin.byteRange[2] = this.signPlugin.byteRange[1] + this.signPlugin.gapSize + 2;
			this.internal.write('/Contents' + gap);

			var tmp = '/ByteRange [0 ' + this.signPlugin.byteRange[1] + ' ' + this.signPlugin.byteRange[2] + ' ';
			this.signPlugin.endByteRangePosition = this.signPlugin.byteRange[2] + 1 /* \n */ + tmp.length;
			this.internal.write(tmp + '		  ]');

			this.internal.write('>>');
			this.internal.write('endobj');

		}
	]);

	jsPDFAPI.events.push([
		'buildDocumentEnd', function (pdf)
		{
			this.signPlugin.byteRange[3] = pdf.content.length - this.signPlugin.byteRange[2];

			var lastByteRange = this.signPlugin.byteRange[3].toString();
			pdf.content = pdf.content.substring(0, this.signPlugin.endByteRangePosition)
				+ lastByteRange
				+ pdf.content.substring(this.signPlugin.endByteRangePosition + lastByteRange.length);

			var pre = pdf.content.substring(0, this.signPlugin.byteRange[1]),
				post = pdf.content.substring(this.signPlugin.byteRange[2], pdf.content.length),
				toHash = pre + post;

			alert("Go PKIjs!\n\n" + toHash.substr(0, 100) + '...');

			var signature = '000000'; // ...

			// padding in hex
			for (var i = signature.length / 2; i < this.signPlugin.gapSize / 2; i++) {
				signature += '00';
			}

			pdf.content = pre + '<' + signature + '>' + post;
		}
	]);

	jsPDF.API.signPlugin = {
		valueObjId: null,
		byteRange : [0, 0, 0, 0],
		endByteRangePosition : null,
		gapSize: 32000 // +2 for < and >
	};


	jsPDFAPI.signHidden = function (fieldName) {
		'use strict';

		var objId = this.internal.newObjectDeferred();
		this.signPlugin.valueObjId = objId;

		this.addSignatureField(fieldName, 0, 0, 0, 0, objId + ' 0 R');

		return this;
	};
})(jsPDF.API);
