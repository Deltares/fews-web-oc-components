/**
 * Binary search for the closest index in a sorted array.
 * If the target is less than the first element, the first element is returned.
 * If the target is greater than the last element, the last element is returned.
 * @param array - The sorted array
 * @param target - The target element
 * @param comparator - The comparator function
 * @returns - The closest index
 * @template T - The type of the elements in the array
 * @example
 * findClosestIndex([1, 2, 3, 4, 5], 3.5, (a, b) => a - b) // 2
 */
export function findClosestIndex<T>(
  array: T[],
  target: T,
  comparator: (a: T, b: T) => number,
): number {
  if (array.length === 0) return -1

  let left = 0
  let right = array.length - 1
  let closest = 0

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)

    if (comparator(array[mid], target) === 0) {
      return mid
    } else if (comparator(array[mid], target) < 0) {
      left = mid + 1
    } else {
      right = mid - 1
    }

    if (
      Math.abs(comparator(array[mid], target)) <
      Math.abs(comparator(array[closest], target))
    ) {
      closest = mid
    }
  }

  return closest
}
