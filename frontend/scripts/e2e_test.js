(async () => {
  const base = 'http://localhost:5000';
  const out = [];
  try {
    // Login
    const loginResp = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@demo.com', senha: 'senha123' })
    });
    async function parseResp(resp) {
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) return await resp.json();
      return await resp.text();
    }

    const login = await parseResp(loginResp);
    out.push({ step: 'login', status: loginResp.status, body: login });

    // Use mock token (server expects 'mock-token')
    const token = 'mock-token';

    // Auth me
    const meResp = await fetch(base + '/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    out.push({ step: 'me', status: meResp.status, body: await parseResp(meResp) });

    // Feed
    const feedResp = await fetch(base + '/api/posts/feed', { headers: { Authorization: `Bearer ${token}` } });
    out.push({ step: 'feed', status: feedResp.status, body: await parseResp(feedResp) });

    // Search (alternative)
    const searchResp = await fetch(base + '/api/search/posts?q=fotografia');
    out.push({ step: 'search_alt', status: searchResp.status, body: await parseResp(searchResp) });

    // Search (original)
    const search2Resp = await fetch(base + '/api/posts/search?q=fotografia');
    out.push({ step: 'search', status: search2Resp.status, body: await parseResp(search2Resp) });

    // Create post
    const createResp = await fetch(base + '/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: 'Post de teste via script' })
    });
    out.push({ step: 'create_post', status: createResp.status, body: await parseResp(createResp) });

    // Add comment to post 2
    const commentResp = await fetch(base + '/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: 2, texto: 'Comentário de teste via script' })
    });
    out.push({ step: 'create_comment', status: commentResp.status, body: await parseResp(commentResp) });

    // Give baze to post 2
    const bazeResp = await fetch(base + '/api/posts/2/baze', { method: 'POST' });
    out.push({ step: 'baze', status: bazeResp.status, body: await parseResp(bazeResp) });

    // Remove baze
    const unbazeResp = await fetch(base + '/api/posts/2/baze', { method: 'DELETE' });
    out.push({ step: 'unbaze', status: unbazeResp.status, body: await parseResp(unbazeResp) });

    // Get comments for post 2
    const commentsResp = await fetch(base + '/api/comments/post/2');
    out.push({ step: 'comments_post2', status: commentsResp.status, body: await parseResp(commentsResp) });

    // Followers for user 1
    const followersResp = await fetch(base + '/api/users/1/seguidores');
    out.push({ step: 'followers_1', status: followersResp.status, body: await parseResp(followersResp) });

    // Follow user 2 with mock token
    const followResp = await fetch(base + '/api/users/2/seguir', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    out.push({ step: 'follow_2', status: followResp.status, body: followResp.status === 200 ? {} : await parseResp(followResp) });

    // Following for user 1
    const followingResp = await fetch(base + '/api/users/1/seguindo');
    out.push({ step: 'following_1', status: followingResp.status, body: await parseResp(followingResp) });

    // Notifications
    const notsResp = await fetch(base + '/api/notificacoes', { headers: { Authorization: `Bearer ${token}` } });
    out.push({ step: 'notifications', status: notsResp.status, body: await parseResp(notsResp) });

    // Mark notifications as read
    const markResp = await fetch(base + '/api/notificacoes/marcar-lidas', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    out.push({ step: 'mark_read', status: markResp.status });

    // Upload image (mock)
    const imgUpResp = await fetch(base + '/api/upload/imagem', { method: 'POST' });
    out.push({ step: 'upload_image', status: imgUpResp.status, body: await parseResp(imgUpResp) });

    // Upload video (mock)
    const vidUpResp = await fetch(base + '/api/upload/video', { method: 'POST' });
    out.push({ step: 'upload_video', status: vidUpResp.status, body: await parseResp(vidUpResp) });
    console.log(JSON.stringify(out, null, 2));
  } catch (err) {
    console.error('ERROR', err);
    process.exitCode = 1;
  }
})();
