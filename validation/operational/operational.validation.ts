import { OperationalScenarioRunner } from './runner';
import { 
  OperationalSanityScenario, 
  OperationalAuthenticationScenario,
  OperationalAttendanceScenario 
} from './scenarios';

async function runOperationalValidation() {
  const runner = new OperationalScenarioRunner();

  // Register operational scenarios
  runner.register(new OperationalSanityScenario());
  runner.register(new OperationalAuthenticationScenario());
  runner.register(new OperationalAttendanceScenario());

  // Execute all registered scenarios sequentially
  await runner.runAll();
}

runOperationalValidation().catch(err => {
  console.error('Fatal error during operational validation execution:', err);
  process.exit(1);
});
