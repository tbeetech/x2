import { Types } from 'mongoose';

/**
 * Generate a new MongoDB ObjectId
 * @returns {Types.ObjectId}
 */
export function newObjectId() {
  return new Types.ObjectId();
}

/**
 * Check if a value is a valid ObjectId
 * @param {any} id
 * @returns {boolean}
 */
export function isValidObjectId(id) {
  return Types.ObjectId.isValid(id);
}

/**
 * Convert string to ObjectId
 * @param {string} id
 * @returns {Types.ObjectId}
 */
export function toObjectId(id) {
  return new Types.ObjectId(id);
}
