import fs from 'fs';

let content = fs.readFileSync('validation/repository/repository.validation.ts', 'utf8');

// Attendance
content = content.replace(/workerId: 'worker-fk',/g, "worker_id: 'worker-fk',");
content = content.replace(/checkInAt:/g, "check_in_at:");
content = content.replace(/const att = await AttendanceRepository.append\(appendPayload\);/g, "await AttendanceRepository.append(appendPayload);\n  const att = await AttendanceRepository.findActiveSession('worker-fk');");
content = content.replace(/att.id/g, "att!.id");
content = content.replace(/att.checkOutAt/g, "att!.check_out_at");
content = content.replace(/const checkedOut = await AttendanceRepository.updateCheckOut/g, "await AttendanceRepository.updateCheckOut");
content = content.replace(/checkedOut.checkOutAt === checkOutTime/g, "(await AttendanceRepository.findLatest('worker-fk'))!.check_out_at === checkOutTime");

// Shift
content = content.replace(/startedAt:/g, "started_at:");
content = content.replace(/const shift = await ShiftRepository.createShift\(createPayload\);/g, "await ShiftRepository.createShift(createPayload);\n  const shift = await ShiftRepository.getActiveShift();");
content = content.replace(/shift.id === 's1'/g, "shift!.id === 's1'");
content = content.replace(/shift.status === 'ACTIVE'/g, "shift!.status === 'ACTIVE'");
content = content.replace(/ShiftRepository.getActiveShift\('worker-fk'\)/g, "ShiftRepository.getActiveShift()");
content = content.replace(/const closed = await ShiftRepository.closeShift\('s1', closeTime\);/g, "await ShiftRepository.closeShift('s1', closeTime);");
content = content.replace(/assert\(closed.status === 'COMPLETED'/g, "const closed = (await ShiftRepository.getShiftHistory('worker-fk'))[0];\n  assert(closed.status === 'COMPLETED'");
content = content.replace(/closed.endedAt/g, "closed.ended_at");

// Event
content = content.replace(/eventType:/g, "event_type:");
content = content.replace(/eventData:/g, "event_data:");
content = content.replace(/occurredAt:/g, "occurred_at:");
content = content.replace(/shiftId:/g, "shift_id:");
content = content.replace(/const ev = await EventRepository.appendEvent\(appendPayload\);/g, "await EventRepository.appendEvent(appendPayload);\n  const ev = (await EventRepository.getEventsByShift('s1'))[0];");
content = content.replace(/ev.id/g, "ev!.id");
content = content.replace(/ev.eventType/g, "ev!.event_type");

fs.writeFileSync('validation/repository/repository.validation.ts', content);
