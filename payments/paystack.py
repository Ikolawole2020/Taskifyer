"""
Paystack API client. ALL calls happen server-side — the secret key never
leaves Django. Amounts are handled in Naira here and converted to Kobo
(x100) for Paystack.
"""
import requests
from django.conf import settings

BASE_URL = 'https://api.paystack.co'


def _headers():
    return {
        'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
        'Content-Type': 'application/json',
    }


def list_banks():
    """GET /bank — list of Nigerian banks for the provider onboarding UI."""
    response = requests.get(
        f'{BASE_URL}/bank', headers=_headers(), params={'currency': 'NGN'}, timeout=15
    )
    data = response.json()
    if not data.get('status'):
        raise Exception(data.get('message', 'Failed to fetch banks'))
    return [
        {'name': b['name'], 'code': b['code']}
        for b in data['data']
        if b.get('active')
    ]


def resolve_account(account_number: str, bank_code: str):
    """GET /bank/resolve — validates an account number, returns account_name."""
    response = requests.get(
        f'{BASE_URL}/bank/resolve',
        headers=_headers(),
        params={'account_number': account_number, 'bank_code': bank_code},
        timeout=15,
    )
    data = response.json()
    if not data.get('status'):
        raise Exception(data.get('message', 'Account resolution failed'))
    return {'account_name': data['data']['account_name'], 'account_number': account_number}


def create_transfer_recipient(name: str, account_number: str, bank_code: str):
    """POST /transferrecipient — creates the payout destination for a provider."""
    response = requests.post(
        f'{BASE_URL}/transferrecipient',
        headers=_headers(),
        json={
            'type': 'nuban',
            'name': name,
            'account_number': account_number,
            'bank_code': bank_code,
            'currency': 'NGN',
        },
        timeout=20,
    )
    data = response.json()
    if not data.get('status'):
        raise Exception(data.get('message', 'Failed to create transfer recipient'))
    return data['data']['recipient_code']


def initialize_transaction(email: str, amount_naira, reference: str, callback_url=None):
    """
    POST /transaction/initialize — customer pays 100% to the PLATFORM account
    (escrow). The provider's 90% share is released later via /transfer only
    after job confirmation (or the 48-hour auto-confirmation).
    """
    payload = {
        'email': email,
        'amount': int(amount_naira * 100),  # kobo
        'reference': reference,
        'currency': 'NGN',
    }
    if callback_url:
        payload['callback_url'] = callback_url
    response = requests.post(
        f'{BASE_URL}/transaction/initialize', headers=_headers(), json=payload, timeout=20
    )
    data = response.json()
    if not data.get('status'):
        raise Exception(data.get('message', 'Payment initialization failed'))
    return data['data']  # { authorization_url, access_code, reference }


def verify_transaction(reference: str):
    """GET /transaction/verify/:reference — fallback confirmation."""
    response = requests.get(
        f'{BASE_URL}/transaction/verify/{reference}', headers=_headers(), timeout=15
    )
    data = response.json()
    if not data.get('status'):
        raise Exception(data.get('message', 'Verification failed'))
    return data['data']


def initiate_transfer(amount_naira, recipient_code: str, reference: str, reason: str = ''):
    """POST /transfer — releases the provider's 90% share from platform balance."""
    response = requests.post(
        f'{BASE_URL}/transfer',
        headers=_headers(),
        json={
            'source': 'balance',
            'amount': int(amount_naira * 100),  # kobo
            'recipient': recipient_code,
            'reason': reason or 'BookNfix job payout',
            'reference': reference,
        },
        timeout=20,
    )
    data = response.json()
    if not data.get('status'):
        raise Exception(data.get('message', 'Transfer failed'))
    return data['data']  # { transfer_code, ... }
