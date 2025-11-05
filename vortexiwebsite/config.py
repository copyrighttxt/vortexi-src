from apscheduler.jobstores.redis import RedisJobStore
import pytz
import redis

class Config:
    FLASK_SESSION_KEY : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    AuthorizationKey : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    SQLALCHEMY_DATABASE_URI : str = "postgresql://syntax:gay@localhost:5432/syntaxdb"
    
    SCHEDULER_JOBSTORES = {
        'default': RedisJobStore(host='localhost', port=6379, db=0)
    }
    SCHEDULER_TIMEZONE : pytz.timezone = pytz.utc

    REDIS_CLIENT = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

    FLASK_LIMITED_STORAGE_URI : str = "redis://localhost:6379/0"
    BaseDomain : str = "vortexi.cc"
    BaseURL : str = f"https://www.{BaseDomain}"

    CloudflareTurnstileSiteKey : str = "0x4AAAAAABQup2-ddXh4IHmv"
    CloudflareTurnstileSecretKey : str = "0x4AAAAAABQup8x54tvuzF_gqlubefQV7y4"

    DISCORD_CLIENT_ID : str = 1363965818328580157
    DiscordBotToken : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    DISCORD_CLIENT_SECRET : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    DISCORD_REDIRECT_URI : str = f"https://www.{BaseDomain}/settings/discord_handler"
    DISCORD_AUTHORIZATION_BASE_URL : str = "https://discord.com/api/oauth2/authorize"

    DISCORD_BOT_AUTHTOKEN : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    DISCORD_BOT_AUTHORISED_IPS : list[str] = ["127.0.0.1", "23.136.44.116", "2602:f6b7:0:7::a"]

    DISCORD_ADMIN_LOGS_WEBHOOK : str = "EvenAfterWeAreDeadWeAreStillSecure!!"

    MAILJET_APIKEY : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    MAILJET_SECRETKEY : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    MAILJET_NOREPLY_SENDER : str = "no-reply@vortexi.cc"
    MAILJET_DONATION_TEMPLATE_ID : int = 6984478
    MAILJET_EMAILVERIFY_TEMPLATE_ID : int = 6932923
    MAILJET_PASSWORDRESET_TEMPLATE_ID : int = 6932939

    KOFI_VERIFICATION_TOKEN : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    KOFI_ENABLED : bool = True

    VERIFIED_EMAIL_REWARD_ASSET : int = 197

    ASSETMIGRATOR_ROBLOSECURITY : str = ""
    ASSETMIGRATOR_USE_PROXIES : bool = False
    ASSETMIGRATOR_PROXY_LIST_LOCATION = "./example_file.txt"

    RSA_PRIVATE_KEY_PATH : str = "./app/files/rsa_private_1024.pem"
    RSA_PRIVATE_KEY_PATH2 : str = "./app/files/rsa_private_2048.pem"

    USE_LOCAL_STORAGE : bool = False
    # no use
    AWS_ACCESS_KEY : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    AWS_SECRET_KEY : str = "EvenAfterWeAreDeadWeAreStillSecure!!+SqFlWiud"
    AWS_S3_BUCKET_NAME : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    AWS_S3_DOWNLOAD_CACHE_DIR : str = "./download_cache"
    AWS_REGION_NAME : str = "eu-north-1"
    AWS_S3_CACHE_LIFETIME = 3600
    

    r : str = "sussybakaamongus.s3.eu-north-1.amazonaws.com"
    CDN_URL : str = f"https://{r}" if not USE_LOCAL_STORAGE else f"{BaseURL}/cdn_local"

    SWITCH_TO_ARGON_PASSWORD_HASH : bool = True

    DISCOURSE_SSO_ENABLED : bool = False
    DISCOURSE_FORUM_BASEURL : str = ""
    DISCOURSE_SECRET_KEY : str = ""

    ADMIN_GROUP_ID : int = 1
    FILTER_DISCORD_WEBHOOK : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    ITEMRELEASER_DISCORD_WEBHOOK : str = "EvenAfterWeAreDeadWeAreStillSecure!!"
    ITEMRELEASER_ITEM_PING_ROLE_ID : int = 1364011164387770553

    WTF_CSRF_HEADERS : list[str] = ["x-csrf-token", "X-CSRFToken", "X-CSRF-Token"]

    PROMETHEUS_ENABLED : bool = False
    PROMETHEUS_ALLOWED_IPS : list[str] = ["127.0.0.1"]

    CHEATER_REPORTS_DISCORD_WEBHOOK : str = "EvenAfterWeAreDeadWeAreStillSecure!!"

    ROLIMONS_API_ENABLED : bool = False
    ROLIMONS_API_KEY : str = "ExampleKey"

    GAMESERVER_COMM_PRIVATE_KEY_LOCATION : str = "./app/files/rsa_private_gameserver.pem"

    CRYPTOMUS_PAYMENT_ENABLED : bool = True
    CRYPTOMUS_MERCHANT_ID : str = ""
    CRYPTOMUS_API_KEY : str = ""

    IPAPI_AUTH_KEY : str = "87837f92fa389fcb3fb4" # yall can have this idc
    IPAPI_CACHE_LIFETIME : int = 60 * 60 * 24
    DEBUG_IPS : list[str] = ["0.0.0.0", "127.0.0.1"]
