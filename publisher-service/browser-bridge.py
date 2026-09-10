"""Local worker bridge. Operator installs the pinned social-auto-upload checkout.
Session files and upstream logs stay in a private temporary directory, never Git.
"""
import asyncio, dataclasses, json, os, sys, types
from pathlib import Path

async def main():
    request = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    root = Path(os.environ['SAU_ROOT']).resolve()
    work = Path(sys.argv[1]).resolve().parent
    sys.path.insert(0, str(root))
    conf = types.ModuleType('conf')
    conf.BASE_DIR = work
    conf.LOCAL_CHROME_PATH = os.environ.get('PUBLISHER_CHROME_PATH', '')
    conf.LOCAL_CHROME_HEADLESS = request['action'] != 'login'
    conf.DEBUG_MODE = False
    conf.XHS_SERVER = 'http://127.0.0.1:11901'
    conf.YT_PROXY = None
    sys.modules['conf'] = conf
    # Keep the upstream resource path separate from private session/log paths.
    import utils.base_social_media as resources
    resources.BASE_DIR = root
    account = work / 'session.json'
    if 'session' in request:
        account.write_text(json.dumps(request['session']), encoding='utf-8')
    platform = request['platform']
    if platform == 'tiktok':
        from uploader.tk_uploader.main_chrome import tiktok_setup, TiktokVideo
        if not await tiktok_setup(str(account), handle=request['action'] == 'login'):
            raise RuntimeError('reauthorize')
        if request['action'] == 'publish':
            caption = (request['payload']['title'] + '\n' + request['payload']['description'])[:2200]
            await TiktokVideo(caption, request['video'], [], 0, str(account)).main()
    else:
        import sau_cli as sau
        sau.resolve_account_file = lambda *args, **kwargs: account
        classes = {'douyin':'Douyin','kuaishou':'Kuaishou','xiaohongshu':'Xiaohongshu',
                   'bilibili':'Bilibili','tencent':'Tencent','youtube':'YouTube',
                   'baijiahao':'Baijiahao','alipay':'Alipay','weibo':'Weibo','hupu':'Hupu'}
        if platform not in classes:
            raise ValueError('Unsupported platform')
        if request['action'] == 'login':
            if platform == 'bilibili':
                raise RuntimeError('Bilibili requires an interactive local login; import its session with the admin command')
            result = await getattr(sau, f'login_{platform}_account')('publisher', headless=False)
            if isinstance(result, dict) and result.get('success') is False:
                raise RuntimeError('Login did not complete')
        else:
            if not await getattr(sau, f'check_{platform}_account')('publisher'):
                raise RuntimeError('reauthorize')
            cls = getattr(sau, classes[platform] + 'VideoUploadRequest')
            values = dict(account_name='publisher', video_file=Path(request['video']),
                          title=request['payload']['title'], description=request['payload']['description'],
                          tags=[], publish_date=0, tid=160, visibility='public',
                          headless=True, debug=False, is_draft=False)
            job = cls(**{f.name: values[f.name] for f in dataclasses.fields(cls) if f.name in values})
            await getattr(sau, 'upload_video' if platform == 'douyin' else f'upload_{platform}_video')(job)
    if not account.exists():
        raise RuntimeError('Session was not saved')
    (work / 'result.json').write_text(json.dumps({'session':json.loads(account.read_text(encoding='utf-8')), 'status':'submitted'}), encoding='utf-8')

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as error:
        # Never emit upstream exceptions: they can contain session/token details.
        if str(error) == 'reauthorize':
            (Path(sys.argv[1]).resolve().parent / 'error.json').write_text('{"auth":true}', encoding='utf-8')
        sys.exit(2)
