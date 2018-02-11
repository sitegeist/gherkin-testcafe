const glob = require('glob');
const fs = require('fs');
const {Parser, Compiler} = require('gherkin');

const resolveStepDefinition = require('./resolveStepDefinition');
const {specs} = require('./args').argv;
const paths = [].concat(...specs.map(pattern => glob.sync(pattern)));

//
// Takes a step from a gherkin AST, looks up the corresponding step definition
// and runs the implementation of that definition given the actual values from
// the step.
//
// It also warns, if a step definition could not be found.
//
function resolveAndRunStepDefinition(testController, step) {
    const {expression, implementation} = resolveStepDefinition(step);

    if (expression && implementation) {
        return implementation(
            testController,
            ...expression.match(step.text).map(match => match.getValue())
        );
    } else {
        console.warn(`Step implementation missing for: ${step.text}`);
    }
}

//
// Turns a scenario from a gherkin AST into a testcafe test
//
function createTestFromScenario(scenario) {
    if (scenario.type === 'Background') {
        // scenario already handled through beforeEach hook
        return ;
    }

    test(`Scenario: ${scenario.name}`, t => Promise.all(scenario.steps.map(
        step => resolveAndRunStepDefinition(t, step)
    )));
}

//
// Creates a 'beforeEach' fixture hook based on a Background scenario definition
// @note: testcafé doesnt share state between tests so we use beforeEach hook
// instead of 'before'. Also, the 'before' hook is fired only once even if tests
// are launched in several browsers.
//
function createHookFromBackground(background, fixture) {
    fixture.beforeEach(t => Promise.all(background.steps.map(
        step => resolveAndRunStepDefinition(t, step)
    )));
}

function hasBackground(gherkinAst) {
    return gherkinAst.feature.children[0].type === 'Background';
}

//
// Turns a feature from a gherkin AST into a testcafe fixture
//
function createFixtureFromSpecFile(specFilePath) {
    const gherkinAst = new Parser().parse(fs.readFileSync(specFilePath).toString());
    const fixtureObj = fixture(`Feature: ${gherkinAst.feature.name}`);

    if (hasBackground(gherkinAst)) {
        createHookFromBackground(gherkinAst.feature.children[0], fixtureObj);
    }

    gherkinAst.feature.children.forEach(createTestFromScenario);
}

//
// Run the tests for all mathing paths
//
paths.forEach(createFixtureFromSpecFile);
