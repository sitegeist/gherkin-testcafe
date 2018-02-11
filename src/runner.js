const path = require('path');
const createTestCafe = require('testcafe');

module.exports = async function main({
    hostname = 'localhost',
    browsers = ['chrome:headless'],
    fixture,
    screenshots,
    screenshotsOnFail,
    test,
    assertionTimeout = 3000,
    selectorTimeout = 10000,
    ports
}) {
    const testcafe = await createTestCafe(hostname, ...ports.slice(0, 2));
    const runner = testcafe.createRunner();

    try {
        runner
            .src(path.join(__dirname, 'test.js'))
            .browsers(browsers)
        ;

        if (screenshots) {
            runner.screenshots(screenshots, screenshotsOnFail);
        }

        if (test && !fixture) {
            runner.filter((testName, fixtureName, fixturePath) => {
                return testName === `Scenario: ${test}`;
            });
        }

        if (fixture && !test) {
            runner.filter((testName, fixtureName, fixturePath) => {
                return fixtureName === `Feature: ${fixture}`;
            });
        }

        if (fixture && test) {
            runner.filter((testName, fixtureName, fixturePath) => {
                return fixtureName === `Feature: ${fixture}`
                    && testName === `Scenario: ${test}`;
            });
        }

        const failedCount = await runner.run({
            assertionTimeout: assertionTimeout,
            selectorTimeout: selectorTimeout
        });

        process.exit(failedCount && 1);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
