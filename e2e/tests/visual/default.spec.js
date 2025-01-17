/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/*
Collection of Visual Tests set to run in a default context. The tests within this suite
are only meant to run against openmct's app.js started by `npm run start` within the 
`./e2e/playwright-visual.config.js` file.

These should only use functional expect statements to verify assumptions about the state 
in a test and not for functional verification of correctness. Visual tests are not supposed
to "fail" on assertions. Instead, they should be used to detect changes between builds or branches.

Note: Larger testsuite sizes are OK due to the setup time associated with these tests. 
*/

const { test, expect } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');
const path = require('path');
const sinon = require('sinon');

const VISUAL_GRACE_PERIOD = 5 * 1000; //Lets the application "simmer" before the snapshot is taken

// Snippet from https://github.com/microsoft/playwright/issues/6347#issuecomment-965887758
// Will replace with cy.clock() equivalent
test.beforeEach(async ({ context }) => {
    await context.addInitScript({
        // eslint-disable-next-line no-undef
        path: path.join(__dirname, '../../..', './node_modules/sinon/pkg/sinon.js')
    });
    await context.addInitScript(() => {
        window.__clock = sinon.useFakeTimers(); //Set browser clock to UNIX Epoch
    });
});

test('Visual - Root and About', async ({ page }) => {
    // Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    // Verify that Create button is actionable
    const createButtonLocator = page.locator('button:has-text("Create")');
    await expect(createButtonLocator).toBeEnabled();

    // Take a snapshot of the Dashboard
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'Root');

    // Click About button
    await page.click('.l-shell__app-logo');

    // Modify the Build information in 'about' to be consistent run-over-run
    const versionInformationLocator = page.locator('ul.t-info.l-info.s-info');
    await expect(versionInformationLocator).toBeEnabled();
    await versionInformationLocator.evaluate(node => node.innerHTML = '<li>Version: visual-snapshot</li> <li>Build Date: Mon Nov 15 2021 08:07:51 GMT-0800 (Pacific Standard Time)</li> <li>Revision: 93049cdbc6c047697ca204893db9603b864b8c9f</li> <li>Branch: master</li>');

    // Take a snapshot of the About modal
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'About');
});

test('Visual - Default Condition Set', async ({ page }) => {
    //Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click text=Condition Set
    await page.click('text=Condition Set');

    // Click text=OK
    await page.click('text=OK');

    // Take a snapshot of the newly created Condition Set object
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'Default Condition Set');
});

test('Visual - Default Condition Widget', async ({ page }) => {
    //Go to baseURL
    await page.goto('/', { waitUntil: 'networkidle' });

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click text=Condition Widget
    await page.click('text=Condition Widget');

    // Click text=OK
    await page.click('text=OK');

    // Take a snapshot of the newly created Condition Widget object
    await page.waitForTimeout(VISUAL_GRACE_PERIOD);
    await percySnapshot(page, 'Default Condition Widget');
});
