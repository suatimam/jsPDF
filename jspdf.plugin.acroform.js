/**
 * jsPDF AcroForm PlugIn
 * Copyright (c) 2015 Jan Slabon (Setasign)  jan.slabon@setasign.com
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */

(function (jsPDFAPI) {
	'use strict';

	jsPDFAPI.events.push([
		'putResources', function () {
			var k = this.internal.scaleFactor,
				pageHeight = this.internal.pageSize.height,
				f2 = this.internal.f2,
				refs = [],
				signatureFieldsWithValue = false;

			for (var name in this.acroFormPlugin.fields) {
				var field = this.acroFormPlugin.fields[name],
					rect = "/Rect [" + f2(field.x * k) + " " + f2((pageHeight - field.y) * k) + " " + f2(field.x + field.w * k) + " " + f2(pageHeight - (field.y + field.h) * k) + "] ";

				this.internal.newObjectDeferredBegin(field.objId);
				this.internal.write(field.objId + ' 0 obj');
				this.internal.write('<<');
				this.internal.write('/Type /Annot /Subtype /Widget ' + rect + '/Border [0 0 0] /FT /' + field.fieldType);
				this.internal.write('/T (' + this.internal.pdfEscape(name) + ')');

				var pageInfo = this.internal.getPageInfo(field.pageNumber);
				this.internal.write('/P ' + pageInfo.objId + ' 0 R');

				if (field.pdfValue) {
					this.internal.write('/V ' + field.pdfValue);
				}

				switch (field.fieldType) {
					case 'Sig':
						this.internal.write('/H /P /F 4');
						if (field.pdfValue) {
							signatureFieldsWithValue = true;
						}
						break;
				}

				this.internal.write('>>');
				this.internal.write('endobj');
				refs.push(field.objId + ' 0 R');
			}

			if (refs.length == 0)
				return;

			this.acroFormPlugin.acroFormObjId = this.internal.newObject();
			this.internal.write('<<');
			this.internal.write('/Fields [' + refs.join(' ') + ']');

			if (this.acroFormPlugin.signatureFields) {
				this.internal.write('/SigFlags ' + (signatureFieldsWithValue ? '3' : '1'));
			}

			this.internal.write('>>');
			this.internal.write('endobj');
		}
	]);

	jsPDFAPI.events.push([
		'putCatalog', function () {
			if (!this.acroFormPlugin.acroFormObjId) {
				return;
			}

			this.internal.write('/AcroForm ' + this.acroFormPlugin.acroFormObjId + ' 0 R');
		}
	]);

	if (jsPDFAPI.annotationPlugin == undefined) {
		throw new Error("Signature field plugin requires the annotation plugin.");
	}

	jsPDF.API.acroFormPlugin = {

		/**
		 * An array of objects, indexed by <em>signature field name</em>.
		 */
		fields: {},
		acroFormObjId: null,
		signatureFields: false
	};

	jsPDFAPI.addSignatureField = function (name, x, y, w, h, value) {
		'use strict';

		if (typeof this.acroFormPlugin.fields[name] !== 'undefined') {
			throw new Error("A field with the name (" + name + ") already exists. This is not possible for signature fields.");
		}

		var pageNumber = this.internal.getCurrentPageInfo().pageNumber;

		this.acroFormPlugin.fields[name] = {
			pageNumber: pageNumber,
			x: x,
			y: y,
			w: w,
			h: h,
			name: name,
			type: 'widget',
			fieldType : 'Sig',
			objId: null,
			pdfValue: typeof value === 'undefined' ? null : value
		};

		this.acroFormPlugin.signatureFields = true;
		this.annotationPlugin.annotations[pageNumber].push(this.acroFormPlugin.fields[name]);

		return this;
	};
})(jsPDF.API);
