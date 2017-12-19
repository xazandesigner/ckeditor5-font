/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import FontFamilyEditing from './../../src/fontfamily/fontfamilyediting';

import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

import VirtualTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/virtualtesteditor';
import { getData as getModelData, setData as setModelData } from '../../../ckeditor5-engine/src/dev-utils/model';

describe( 'FontFamilyEditing', () => {
	let editor, doc;

	beforeEach( () => {
		return VirtualTestEditor
			.create( {
				plugins: [ FontFamilyEditing, Paragraph ]
			} )
			.then( newEditor => {
				editor = newEditor;

				doc = editor.document;
			} );
	} );

	afterEach( () => {
		editor.destroy();
	} );

	it( 'should set proper schema rules', () => {
		expect( editor.model.schema.check( { name: '$inline', attributes: 'fontFamily', inside: '$block' } ) ).to.be.true;
		expect( editor.model.schema.check( { name: '$inline', attributes: 'fontFamily', inside: '$clipboardHolder' } ) ).to.be.true;
	} );

	describe( 'config', () => {
		describe( 'default value', () => {
			it( 'should be set', () => {
				expect( editor.config.get( 'fontFamily.items' ) ).to.deep.equal( [
					'Arial, Helvetica, sans-serif',
					'Courier New, Courier, monospace',
					'Georgia, serif',
					'Lucida Sans Unicode, Lucida Grande, sans-serif',
					'Tahoma, Geneva, sans-serif',
					'Times New Roman, Times, serif',
					'Trebuchet MS, Helvetica, sans-serif',
					'Verdana, Geneva, sans-serif'
				] );
			} );
		} );
	} );

	describe( 'configuredItems', () => {
		it( 'should discard unparsable values', () => {
			return VirtualTestEditor
				.create( {
					plugins: [ FontFamilyEditing ],
					fontFamily: {
						items: [ () => {}, 0, true ]
					}
				} )
				.then( newEditor => {
					editor = newEditor;

					const plugin = editor.plugins.get( FontFamilyEditing );

					expect( plugin.configuredItems ).to.deep.equal( [] );
				} );
		} );

		it( 'should pass through object definition', () => {
			return VirtualTestEditor
				.create( {
					plugins: [ FontFamilyEditing ],
					fontFamily: {
						items: [
							{
								label: 'Comic Sans',
								model: 'comic',
								view: {
									name: 'span',
									styles: {
										'font-family': 'Comic Sans'
									}
								}
							}
						]
					}
				} )
				.then( newEditor => {
					editor = newEditor;

					const plugin = editor.plugins.get( FontFamilyEditing );

					expect( plugin.configuredItems ).to.deep.equal( [
						{
							label: 'Comic Sans',
							model: 'comic',
							view: {
								name: 'span',
								styles: {
									'font-family': 'Comic Sans'
								}
							}
						}
					] );
				} );
		} );

		describe( 'shorthand presets', () => {
			it( 'should return full preset from string presets', () => {
				return VirtualTestEditor
					.create( {
						plugins: [ FontFamilyEditing ],
						fontFamily: {
							items: [
								'Arial',
								'"Comic Sans MS", sans-serif',
								'Lucida Console, \'Courier New\', Courier, monospace'
							]
						}
					} )
					.then( newEditor => {
						editor = newEditor;

						const plugin = editor.plugins.get( FontFamilyEditing );

						expect( plugin.configuredItems ).to.deep.equal( [
							{
								label: 'Arial',
								model: 'Arial',
								view: {
									name: 'span',
									styles: {
										'font-family': 'Arial'
									}
								},
								acceptsAlso: [
									{
										name: 'span',
										styles: {
											'font-family': new RegExp( '("|\'|&qout;|\\W){0,2}Arial("|\'|&qout;|\\W){0,2}' )
										}
									}
								]
							},
							{
								label: 'Comic Sans MS',
								model: 'Comic Sans MS',
								view: {
									name: 'span',
									styles: {
										'font-family': '\'Comic Sans MS\', sans-serif'
									}
								},
								acceptsAlso: [
									{
										name: 'span',
										styles: {
											'font-family': new RegExp(
												'("|\'|&qout;|\\W){0,2}Comic Sans MS("|\'|&qout;|\\W){0,2},' +
												'("|\'|&qout;|\\W){0,2}sans-serif("|\'|&qout;|\\W){0,2}'
											)
										}
									}
								]
							},
							{
								label: 'Lucida Console',
								model: 'Lucida Console',
								view: {
									name: 'span',
									styles: {
										'font-family': '\'Lucida Console\', \'Courier New\', Courier, monospace'
									}
								},
								acceptsAlso: [
									{
										name: 'span',
										styles: {
											'font-family': new RegExp(
												'("|\'|&qout;|\\W){0,2}Lucida Console("|\'|&qout;|\\W){0,2},' +
												'("|\'|&qout;|\\W){0,2}Courier New("|\'|&qout;|\\W){0,2},' +
												'("|\'|&qout;|\\W){0,2}Courier("|\'|&qout;|\\W){0,2},' +
												'("|\'|&qout;|\\W){0,2}monospace("|\'|&qout;|\\W){0,2}'
											)
										}
									}
								]
							}
						] );
					} );
			} );
		} );
	} );

	describe( 'editing pipeline conversion', () => {
		beforeEach( () => {
			return VirtualTestEditor
				.create( {
					plugins: [ FontFamilyEditing, Paragraph ],
					fontFamily: {
						items: [
							'Arial',
							'Lucida Sans Unicode, Lucida Grande, sans-serif',
							{
								label: 'My font',
								model: 'my',
								view: {
									name: 'mark',
									classes: 'my-style'
								}
							}
						]
					}
				} )
				.then( newEditor => {
					editor = newEditor;

					doc = editor.model;
				} );
		} );

		it( 'should discard unknown fontFamily attribute values', () => {
			setModelData( doc, '<paragraph>f<$text fontFamily="foo-bar">o</$text>o</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>foo</p>' );
		} );

		it( 'should convert fontFamily attribute to configured simple preset', () => {
			setModelData( doc, '<paragraph>f<$text fontFamily="Arial">o</$text>o</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>f<span style="font-family:Arial;">o</span>o</p>' );
		} );

		it( 'should convert fontFamily attribute to configured complex preset', () => {
			setModelData( doc, '<paragraph>f<$text fontFamily="Lucida Sans Unicode">o</$text>o</paragraph>' );

			expect( editor.getData() )
				.to.equal( '<p>f<span style="font-family:\'Lucida Sans Unicode\', \'Lucida Grande\', sans-serif;">o</span>o</p>' );
		} );

		it( 'should convert fontFamily attribute from user defined settings', () => {
			setModelData( doc, '<paragraph>f<$text fontFamily="my">o</$text>o</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>f<mark class="my-style">o</mark>o</p>' );
		} );
	} );

	describe( 'data pipeline conversions', () => {
		beforeEach( () => {
			return VirtualTestEditor
				.create( {
					plugins: [ FontFamilyEditing, Paragraph ],
					fontFamily: {
						items: [
							'Lucida Sans Unicode, Lucida Grande, sans-serif',
							{
								label: 'My other setting',
								model: 'my-other',
								view: {
									name: 'span',
									styles: { 'font-family': 'Other' }
								}
							},
							{
								label: 'My setting',
								model: 'my',
								view: {
									name: 'mark',
									styles: { 'font-family': 'Verdana' },
									classes: 'my-style'
								}
							},
							{
								label: 'Hybrid',
								model: 'complex',
								view: {
									name: 'span',
									classes: [ 'text-complex' ]
								},
								acceptsAlso: [
									{ name: 'span', styles: { 'font-family': 'Arial' } },
									{ name: 'span', styles: { 'font-family': 'Arial,sans-serif' } },
									{ name: 'span', attributes: { 'data-font': 'Arial' } }
								]
							}
						]
					}
				} )
				.then( newEditor => {
					editor = newEditor;

					doc = editor.model;
				} );
		} );

		it( 'should convert from element with defined style when with other styles', () => {
			const data = '<p>f<span style="font-family: Other;font-size: 18px">o</span>o</p>';

			editor.setData( data );

			expect( getModelData( doc ) ).to.equal( '<paragraph>[]f<$text fontFamily="my-other">o</$text>o</paragraph>' );

			expect( editor.getData() ).to.equal( '<p>f<span style="font-family:Other;">o</span>o</p>' );
		} );

		it( 'should convert from user defined element', () => {
			const data = '<p>f<mark class="my-style" style="font-family:Verdana;">o</mark>o</p>';

			editor.setData( data );

			expect( getModelData( doc ) ).to.equal( '<paragraph>[]f<$text fontFamily="my">o</$text>o</paragraph>' );

			expect( editor.getData() ).to.equal( data );
		} );

		it( 'should convert from complex definitions', () => {
			editor.setData(
				'<p>f<span style="font-family:Arial;">o</span>o</p>' +
				'<p>f<span style="font-family: Arial,sans-serif">o</span>o</p>' +
				'<p>b<span data-font="Arial">a</span>r</p>' +
				'<p>b<span class="text-complex">a</span>z</p>'
			);

			expect( getModelData( doc ) ).to.equal(
				'<paragraph>[]f<$text fontFamily="complex">o</$text>o</paragraph>' +
				'<paragraph>f<$text fontFamily="complex">o</$text>o</paragraph>' +
				'<paragraph>b<$text fontFamily="complex">a</$text>r</paragraph>' +
				'<paragraph>b<$text fontFamily="complex">a</$text>z</paragraph>'
			);

			expect( editor.getData() ).to.equal(
				'<p>f<span class="text-complex">o</span>o</p>' +
				'<p>f<span class="text-complex">o</span>o</p>' +
				'<p>b<span class="text-complex">a</span>r</p>' +
				'<p>b<span class="text-complex">a</span>z</p>'
			);
		} );

		it( 'should convert from various inline style definitions', () => {
			editor.setData(
				'<p>f<span style="font-family:\'Lucida Sans Unicode\', \'Lucida Grande\', sans-serif;">o</span>o</p>' +
				'<p>f<span style="font-family:Lucida Sans Unicode, Lucida Grande, sans-serif;">o</span>o</p>' +
				'<p>f<span style="font-family:&quot;Lucida Sans Unicode&quot;, &quot;Lucida Grande&quot;, sans-serif;">o</span>o</p>'
			);

			expect( getModelData( doc ) ).to.equal(
				'<paragraph>[]f<$text fontFamily="Lucida Sans Unicode">o</$text>o</paragraph>' +
				'<paragraph>f<$text fontFamily="Lucida Sans Unicode">o</$text>o</paragraph>' +
				'<paragraph>f<$text fontFamily="Lucida Sans Unicode">o</$text>o</paragraph>'
			);

			expect( editor.getData() ).to.equal(
				'<p>f<span style="font-family:\'Lucida Sans Unicode\', \'Lucida Grande\', sans-serif;">o</span>o</p>' +
				'<p>f<span style="font-family:\'Lucida Sans Unicode\', \'Lucida Grande\', sans-serif;">o</span>o</p>' +
				'<p>f<span style="font-family:\'Lucida Sans Unicode\', \'Lucida Grande\', sans-serif;">o</span>o</p>'
			);
		} );
	} );
} );
