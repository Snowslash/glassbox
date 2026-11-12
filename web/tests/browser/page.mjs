export async function createPage(context, timeout = 10000) {
  context.setDefaultTimeout(timeout);
  context.setDefaultNavigationTimeout(timeout);
  let timer;
  try {
    return await Promise.race([
      context.newPage(),
      new Promise((_, reject) => {timer = setTimeout(() => reject(new Error(`Browser page creation exceeded ${timeout} ms`)), timeout);}),
    ]);
  } catch (error) {
    // A timeout alone cannot cancel a pending browser protocol operation.
    await context.close();
    throw error;
  } finally {clearTimeout(timer);}
}
