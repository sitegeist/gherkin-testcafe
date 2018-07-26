const path = require('path');
const createTestCafe = require('testcafe');

module.exports = async function main({
	hostname = 'localhost',
	browsers,
	ports,
	skipJsErrors,
	disablePageReloads,
 	quarantineMode,
	debugMode,
	debugOnFail,
	speed

}) {
	const testcafe = await createTestCafe(hostname, ...ports.slice(0, 2));
	const runner = testcafe.createRunner();

	try {
		const failedCount = await runner.src(path.join(__dirname, 'test.js')).browsers(browsers).run({skipJsErrors, disablePageReloads, quarantineMode, debugMode, debugOnFail, speed});
		process.exit(failedCount && 1);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}
